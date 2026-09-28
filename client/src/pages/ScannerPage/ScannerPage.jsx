import {
    useState,
} from "react";

import {
    Content,
} from "../../App.styles.js";

import {
    scanSite,
    testFillForm,
} from "../../api/leadBotApi.js";

import {
    normalizeUrl,
} from "../../utils/formUtils.js";

import {
    Header,
} from "../../components/Header/Header.jsx";

import {
    Scanner,
} from "../../components/Scanner/Scanner.jsx";

import {
    LeadData,
} from "../../components/LeadData/LeadData.jsx";

import {
    ScanResults,
} from "../../components/ScanResults/ScanResults.jsx";


export const ScannerPage = () => {
    const [
        url,
        setUrl,
    ] = useState("");

    const [
        result,
        setResult,
    ] = useState(null);

    const [
        error,
        setError,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        leadData,
        setLeadData,
    ] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
    });

    const [
        testingForm,
        setTestingForm,
    ] = useState(null);

    const [
        testResult,
        setTestResult,
    ] = useState(null);

    const [
        testError,
        setTestError,
    ] = useState(null);


    const handleLeadChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setLeadData(
            (
                current
            ) => ({
                ...current,

                [name]:
                    value,
            })
        );
    };


    const handleScan = async (
        event
    ) => {
        event.preventDefault();

        const normalizedUrl =
            normalizeUrl(
                url
            );

        if (!normalizedUrl) {
            setError(
                "Введите адрес сайта"
            );

            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setTestResult(null);
        setTestError(null);

        try {
            const data =
                await scanSite(
                    normalizedUrl
                );

            setResult(
                data
            );
        } catch (error) {
            setError(
                error.message ||
                    "Не удалось проанализировать сайт"
            );
        } finally {
            setLoading(false);
        }
    };


    const handleTestFill =
        async (form) => {
            setTestingForm(
                form.formIndex
            );

            setTestResult(
                null
            );

            setTestError(
                null
            );

            try {
                const data =
                    await testFillForm({
                        pageUrl:
                            form.pageUrl,

                        leadData,

                        trigger:
                            form.trigger ||
                            null,
                    });

                setTestResult({
                    formIndex:
                        form.formIndex,

                    ...data,
                });
            } catch (error) {
                if (
                    error.data
                        ?.screenshot
                ) {
                    setTestResult({
                        formIndex:
                            form.formIndex,

                        filledCount:
                            0,

                        screenshot:
                            error.data
                                .screenshot,

                        diagnostic:
                            error.data
                                .diagnostic,
                    });
                }

                setTestError(
                    error.message ||
                        "Ошибка тестового заполнения"
                );
            } finally {
                setTestingForm(
                    null
                );
            }
        };


    return (
        <>
            <Header
                eyebrow="Автоматизация заявок"
                title="Сканер сайтов"
                subtitle="Находим и проверяем формы компаний"
            />

            <Content>
                <Scanner
                    url={
                        url
                    }
                    loading={
                        loading
                    }
                    error={
                        error
                    }
                    onUrlChange={
                        setUrl
                    }
                    onSubmit={
                        handleScan
                    }
                />

                <LeadData
                    leadData={
                        leadData
                    }
                    onChange={
                        handleLeadChange
                    }
                />

                <ScanResults
                    result={
                        result
                    }
                    loading={
                        loading
                    }
                    testingForm={
                        testingForm
                    }
                    testResult={
                        testResult
                    }
                    testError={
                        testError
                    }
                    onTestFill={
                        handleTestFill
                    }
                />
            </Content>
        </>
    );
};
