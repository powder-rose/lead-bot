import { BlockList, isIP } from 'node:net';

import { lookup as dnsLookup } from 'node:dns/promises';

const blockedIPv4 = new BlockList();

const forbiddenRanges = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

for (const [address, prefix] of forbiddenRanges) {
  blockedIPv4.addSubnet(address, prefix, 'ipv4');
}

const publicIPv6 = new BlockList();
publicIPv6.addSubnet('2000::', 3, 'ipv6');

const blockedIPv6 = new BlockList();

for (const [address, prefix] of [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
]) {
  blockedIPv6.addSubnet(address, prefix, 'ipv6');
}

export class UnsafeTargetError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = 'UnsafeTargetError';
    this.status = status;
  }
}

export const isPublicAddress = address => {
  const family = isIP(address);

  if (family === 4) {
    return !blockedIPv4.check(address, 'ipv4');
  }

  if (family === 6) {
    return publicIPv6.check(address, 'ipv6') && !blockedIPv6.check(address, 'ipv6');
  }

  return false;
};

export const parsePublicUrl = value => {
  let url;

  try {
    if (typeof value !== 'string' || value.length > 8192) {
      throw new Error();
    }

    url = new URL(value);
  } catch {
    throw new UnsafeTargetError('Укажите корректный адрес сайта', 400);
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new UnsafeTargetError('Разрешены только HTTP и HTTPS адреса без логина и пароля', 400);
  }

  if (url.port) {
    throw new UnsafeTargetError('Разрешены только стандартные порты HTTP (80) и HTTPS (443)');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');

  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    (!isIP(hostname) && !hostname.includes('.')) ||
    (isIP(hostname) && !isPublicAddress(hostname))
  ) {
    throw new UnsafeTargetError('Доступ к внутренним и служебным адресам запрещён');
  }

  return { url, hostname };
};
export const resolvePublicTarget = async (value, { lookup = dnsLookup } = {}) => {
  const target = parsePublicUrl(value);

  // Если введён IP, он уже проверен в parsePublicUrl.
  if (isIP(target.hostname)) {
    return {
      ...target,
      addresses: [
        {
          address: target.hostname,
          family: isIP(target.hostname),
        },
      ],
    };
  }

  let addresses;
  let timer;

  try {
    addresses = await Promise.race([
      lookup(target.hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('DNS timeout'));
        }, 3000);
      }),
    ]);
  } catch {
    throw new UnsafeTargetError('Не удалось проверить DNS сайта. Проверьте адрес и повторите', 400);
  } finally {
    clearTimeout(timer);
  }

  if (
    !Array.isArray(addresses) ||
    addresses.length === 0 ||
    addresses.length > 64 ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new UnsafeTargetError('Домен указывает на внутренний или служебный адрес');
  }

  return {
    ...target,
    addresses: addresses.map(({ address }) => ({
      address,
      family: isIP(address),
    })),
  };
};
