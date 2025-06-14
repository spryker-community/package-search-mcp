import { algoliasearch } from "algoliasearch";
import {createLogger} from "./logger.js";
import * as process from "node:process";
import {
    SPRYKER_ALGOLIA_INDEX_NAME,
    SPRYKER_ALGOLIA_APP_ID,
    SPRYKER_ALGOLIA_API_KEY,
    HITS_PER_PAGE,
} from "./config.js";

const appId = process.env.SPRYKER_ALGOLIA_APP_ID || SPRYKER_ALGOLIA_APP_ID;
const apiKey = process.env.SPRYKER_ALGOLIA_API_KEY || SPRYKER_ALGOLIA_API_KEY;
const indexName = process.env.SPRYKER_ALGOLIA_INDEX_NAME || SPRYKER_ALGOLIA_INDEX_NAME;
const hitsPerPage = HITS_PER_PAGE;

const client = algoliasearch(appId, apiKey);
const logger = createLogger();

export const algoliaSearch = async ({query}) => {
    try {
        const response = await client.search({
            requests: [{
                indexName: indexName,
                query: query,
                hitsPerPage: hitsPerPage,
                getRankingInfo: true
            }],
        });

        const hits = response?.results?.[0]?.hits ?? [];

        if (hits.length === 0) {
            return [];
        }

        return hits.map(hit => {
            return {
                title: hit.title,
                url: hit.url_without_anchor,
            };
        });
    } catch (error) {
        logger.error('Algolia search error:', error);
        throw error;
    }
}