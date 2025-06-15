import {
    buildGitHubQuery,
    formatResults,
    formatCodeResults,
    formatDocsResults,
    normalizeQuery,
    validateOrganisations,
} from "./utils.js";
import {searchGitHubRepositories, searchGitHubCode, getFileContentFromGitHubSprykerDocs} from "./githubClient.js";
import {createLogger} from "./logger.js";
import {algoliaSearch} from "./algoliaSearchClient.js";


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

        const results = await algoliaSearch({query: normalizedQuery});

        logger.info(`Algolia have found ${results.length} results.`, { query });

        const contents = await Promise.all(
            results.map(async (hit) => {
                let url = hit.url
                    .replace(
                    /^https:\/\/docs\.spryker\.com/, '')
                    .replace('.html', '');

                if (!url.endsWith('.md')) {
                    url += '.md';
                }

                try {
                    const content = await getFileContentFromGitHubSprykerDocs(url);
                    return { url: hit.url, text: content };
                } catch (error) {
                    logger.error(`Failed to fetch ${url}: ${error.message}`);
                    return { url, text: null, error: error.message };
                }
            })
        );

        return {
            content: [{
                type: `text`,
                text: formatDocsResults(contents),
            }],
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
