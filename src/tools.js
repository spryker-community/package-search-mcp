import {
    buildGitHubQuery,
    formatResults,
    formatCodeResults,
    formatDocsResults,
    normalizeQuery,
    validateOrganisations,
} from "./utils.js";
import {searchGitHubRepositories, searchGitHubCode} from "./githubClient.js";
import {createLogger} from "./logger.js";

const logger = createLogger();

export const searchSprykerPackages = async ({query, organisations}) => {
    logger.info(`Received searchSprykerPackages request`, { query, organisations });

    try {
        const normalizedQuery = normalizeQuery(query);

        const validatedOrgs = validateOrganisations(organisations);
        logger.info(`Using organizations for searchSprykerPackages`, { organisations: validatedOrgs });

        const githubQuery = buildGitHubQuery(normalizedQuery, validatedOrgs);

        logger.info(`Performing GitHub repository searchSprykerPackages`, { query: githubQuery });

        const searchResults = await searchGitHubRepositories(githubQuery);

        logger.info(`GitHub searchSprykerPackages completed`, {
            resultCount: searchResults.items ? searchResults.items.length : 0,
            totalCount: searchResults.total_count
        });

        const formattedText = formatResults(searchResults.items, validatedOrgs);
        logger.debug(`Search results formatted for display`);

        return {
            content: [{
                type: `text`,
                text: formattedText
            }]
        };
    } catch (error) {
        logger.error(`Error in search: ${error.message}`, {
            error,
            stack: error.stack
        });

        return {
            content: [{
                type: `text`,
                text: `Error performing search: ${error.message}`
            }]
        };
    }
}

export const searchSprykerCode = async ({query, organisations}) => {
    logger.info(`Received searchSprykerCode request`, { query, organisations });

    try {
        const normalizedQuery = normalizeQuery(query);

        const validatedOrgs = validateOrganisations(organisations);
        logger.info(`Using organizations for code search`, { organisations: validatedOrgs });

        const githubQuery = buildGitHubQuery(normalizedQuery, validatedOrgs) + ` in:file` + ` language:php`;

        logger.info(`Performing GitHub code search`, { query: githubQuery });

        const searchResults = await searchGitHubCode(githubQuery);

        logger.info(`GitHub code search completed`, {
            resultCount: searchResults.items ? searchResults.items.length : 0,
            totalCount: searchResults.total_count
        });

        const formattedText = formatCodeResults(searchResults.items, validatedOrgs);
        logger.debug(`Code search results formatted for display`);

        return {
            content: [{
                type: `text`,
                text: formattedText
            }]
        };
    } catch (error) {
        logger.error(`Error in code search: ${error.message}`, {
            error,
            stack: error.stack
        });

        return {
            content: [{
                type: `text`,
                text: `Error performing code search: ${error.message}`
            }]
        };
    }
}

export const searchSprykerDocs = async ({query}) => {
    logger.info(`Received searchSprykerDocs request`, { query });

    try {
        const normalizedQuery = normalizeQuery(query);

        // Fixed search scope: only spryker/spryker-docs repository with MD files
        const githubQuery = `${normalizedQuery} repo:spryker/spryker-docs path:docs/ in:file extension:md`;

        logger.info(`Performing GitHub docs search`, { query: githubQuery });

        const searchResults = await searchGitHubCode(githubQuery);

        logger.info(`GitHub docs search completed`, {
            resultCount: searchResults.items ? searchResults.items.length : 0,
            totalCount: searchResults.total_count
        });

        // Format results similar to code search but with a different header
        const formattedText = formatDocsResults(searchResults.items);
        logger.debug(`Docs search results formatted for display`);

        return {
            content: [{
                type: `text`,
                text: formattedText
            }]
        };
    } catch (error) {
        logger.error(`Error in docs search: ${error.message}`, {
            error,
            stack: error.stack
        });

        return {
            content: [{
                type: `text`,
                text: `Error performing docs search: ${error.message}`
            }]
        };
    }
}
