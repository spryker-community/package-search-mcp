import {createLogger} from "./logger.js";
import {GITHUB_API_URL, GITHUB_SEARCH_REPOS_ENDPOINT, GITHUB_SEARCH_CODE_ENDPOINT, GITHUB_SEARCH_PACKAGE_LIMIT} from "./config.js";
import * as process from "node:process";

import axios from "axios";

const logger = createLogger();

/**
 * Configure axios with GitHub API token if available
 * @returns {Object} - Configured axios instance
 */
const getGitHubClient = () => {
    const headers = {
        "Accept": "application/vnd.github.v3+json"
    };

    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    // Add GitHub token if available
    if (token) {
        logger.debug(`Using GitHub API token for authentication`);
        headers[`Authorization`] = `token ${token}`;
    } else {
        logger.warn(`No GitHub API token found. API rate limits may apply.`);
    }

    return axios.create({
        baseURL: GITHUB_API_URL,
        headers
    });
};

/**
 * Search GitHub repositories using Axios
 *
 * @param {string} query - The search query
 * @returns {Promise<Object>} - GitHub API response
 */
export const searchGitHubRepositories = async (query) => {
    const githubClient = getGitHubClient();

    logger.debug(`Calling GitHub API`, {
        endpoint: GITHUB_SEARCH_REPOS_ENDPOINT,
        query
    });

    try {
        const response = await githubClient.get(GITHUB_SEARCH_REPOS_ENDPOINT, {
            params: {
                q: query,
                per_page: GITHUB_SEARCH_PACKAGE_LIMIT
            }
        });

        logger.debug(`GitHub API response received`, {
            status: response.status,
            totalCount: response.data.total_count,
            itemCount: response.data.items.length
        });

        return response.data;
    } catch (error) {
        logger.error(`GitHub API request failed`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        throw new Error(`GitHub API request failed: ${error.message}`);
    }
};

/**
 * Search GitHub code using Axios
 *
 * @param {string} query - The search query
 * @returns {Promise<Object>} - GitHub API response
 */
export const searchGitHubCode = async (query) => {
    const githubClient = getGitHubClient();

    logger.debug(`Calling GitHub API for code search`, {
        endpoint: GITHUB_SEARCH_CODE_ENDPOINT,
        query
    });

    try {
        const response = await githubClient.get(GITHUB_SEARCH_CODE_ENDPOINT, {
            params: {
                q: query
            }
        });

        logger.debug(`GitHub API code search response received`, {
            status: response.status,
            totalCount: response.data.total_count,
            itemCount: response.data.items.length
        });

        return response.data;
    } catch (error) {
        logger.error(`GitHub API code search request failed`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        throw new Error(`GitHub API code search request failed: ${error.message}`);
    }
};
