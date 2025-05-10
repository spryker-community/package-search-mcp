#!/usr/bin/env node

/**
 * Spryker Project Semantic Search Tool
 *
 * This file initializes a Model Context Protocol server that provides
 * semantic searchSprykerPackages capabilities for the Spryker codebase.
 * The tool searches GitHub repositories for Spryker packages based on
 * the provided query and organization filters.
 *
 * @module SprykerPackageSearch
 */

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {z} from "zod";
import dotenv from "dotenv";
import {createLogger} from "./logger.js";
import {searchSprykerPackages, searchSprykerCode} from "./tools.js";

dotenv.config();

const logger = createLogger();

const server = new McpServer({
    name: `SprykerPackageSearch`,
    version: `1.0.0`,
    description: `The tool provides search capabilities for the Spryker packages in Github.`
});

logger.info(`Initializing MCP server`);

server.tool(
    `search_spryker_packages`,
    `To search the Spryker package repository in Github`,
    {
        query: z
            .string()
            .max(120)
            .min(5)
            .describe(`The natural language query to search in Github`),
        organisations: z
            .array(z.string())
            .optional()
            .describe(`Optional array of organisations to filter by [\`spryker\`, \`spryker-eco\`, \`spryker-sdk\`, \`spryker-shop\``)
    },
    searchSprykerPackages
);

server.tool(
    `search_spryker_package_code`,
    `To search code in Spryker GitHub repositories`,
    {
        query: z
            .string()
            .max(120)
            .min(5)
            .describe(`The natural language query to search in code of Spryker packages`),
        organisations: z
            .array(z.string())
            .optional()
            .describe(`Optional array of organisations to filter by [\`spryker\`, \`spryker-eco\`, \`spryker-sdk\`, \`spryker-shop\``)
    },
    searchSprykerCode
);


const transport = new StdioServerTransport();

try {
    await server.connect(transport);
    logger.info(`Hello! MCP server connected and ready to process requests`);
    logger.info(`Server is configured!`);
} catch (error) {
    logger.error(`Failed to start MCP server: ${error.message}`, {
        error,
        stack: error.stack
    });
    process.exit(1);
}
