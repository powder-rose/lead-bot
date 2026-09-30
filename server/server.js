import express from "express";
import cors from "cors";

import { PORT } from "./src/constants.js";

import companiesRouter
    from "./src/routes/companies.js";

import scanRouter from "./src/routes/scan.js";
import testFillRouter from "./src/routes/test-fill.js";

import companiesImportRouter
    from "./src/routes/companies-import.js";

import {
    closeSharedBrowser,
} from "./src/browser.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            error: null,

            data: {
                status: "ok",
            },
        });
    }
);

app.use(
    "/api/scan",
    scanRouter
);

app.use(
    "/api/test-fill",
    testFillRouter
);
app.use(
    "/api/companies",
    companiesRouter
);
app.use(
    "/api/companies/import",
    companiesImportRouter
);


const server =
    app.listen(
        PORT,
        () => {
            console.log(
                `Server started: http://localhost:${PORT}`
            );
        }
    );


let shuttingDown =
    false;


const shutdown =
    async (signal) => {
        if (shuttingDown) {
            return;
        }

        shuttingDown =
            true;

        console.log(
            `Получен ${signal}. Завершаем сервер...`
        );

        server.close(
            async () => {
                await closeSharedBrowser();

                console.log(
                    "LeadBot остановлен корректно"
                );

                process.exit(0);
            }
        );

        /*
         * Защита на случай зависшего HTTP-запроса.
         */
        setTimeout(
            async () => {
                await closeSharedBrowser();

                process.exit(1);
            },
            5000
        ).unref();
    };


process.on(
    "SIGINT",
    () => shutdown(
        "SIGINT"
    )
);


process.on(
    "SIGTERM",
    () => shutdown(
        "SIGTERM"
    )
);  