import {SPRYKER_ORGS} from './config.js';

const validOrgs = SPRYKER_ORGS

/**
 * Normalize and prepare the searchSprykerPackages query
 *
 * @param {string} query - The original searchSprykerPackages query
 * @returns {string} - The normalized searchSprykerPackages query for GitHub
 */
export const normalizeQuery = (query) => {
    return query.trim().replace(/\s+/g, ' ');
};

/**
 * Validate and prepare organizations filter
 *
 * @param {string[]} organisations - List of organizations to filter by
 * @returns {string[]} - Valid list of organizations
 */
export const validateOrganisations = (organisations = []) => {
    if (!organisations || organisations.length === 0) {
        return validOrgs;
    }

    const validatedOrgs = organisations.filter(org => validOrgs.includes(org));

    if (validatedOrgs.length === 0) {
        return validOrgs;
    }

    return validatedOrgs;
};

/**
 * Format searchSprykerPackages results into a readable text format
 *
 * @param {Object[]} repositories - List of repository results
 * @param {string[]} organisations - The organizations that were searched
 * @returns {string} - Formatted text results
 */
export const formatResults = (repositories, organisations) => {
    if (!repositories || repositories.length === 0) {
        return 'No repositories found matching your searchSprykerPackages criteria.';
    }

    let formattedText = `Found ${repositories.length} repositories:\n\n`;

    repositories.forEach((repo, index) => {
        formattedText += `${index + 1}. ${repo.name}\n`;
        formattedText += `   Description: ${repo.description || 'No description available'}\n`;
        formattedText += `   URL: ${repo.html_url}\n\n`;
    });

    formattedText += `Search performed across organizations: ${organisations.join(', ')}`;

    return formattedText;
};

/**
 * Create GitHub searchSprykerPackages query with organization filters
 *
 * @param {string} query - Normalized searchSprykerPackages query
 * @param {string[]} organisations - List of organizations to filter by
 * @returns {string} - Complete GitHub searchSprykerPackages query
 */
export const buildGitHubQuery = (query, organisations) => {
    // Start with the base query
    let githubQuery = query;

    // Add organization filters
    if (organisations && organisations.length > 0) {
        const orgFilters = organisations.map(org => `org:${org}`).join(' ');
        githubQuery = `${githubQuery} ${orgFilters}`;
    }

    return githubQuery;
};