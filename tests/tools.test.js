import { searchSprykerPackages, searchSprykerCode, searchSprykerDocs } from '../src/tools.js';
import * as utils from '../src/utils.js';
import * as githubClient from '../src/githubClient.js';
import * as algolia from '../src/algoliaSearchClient.js';


// Mock the dependencies
jest.mock('../src/utils.js');
jest.mock('../src/githubClient.js');
jest.mock('../src/algoliaSearchClient.js');

jest.mock('../src/logger.js', () => ({
    createLogger: () => ({
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    })
}));

describe('searchSprykerPackages', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        utils.normalizeQuery.mockImplementation(query => query);
        utils.validateOrganisations.mockReturnValue(['spryker']);
        utils.buildGitHubQuery.mockReturnValue('test-query org:spryker');
        utils.formatResults.mockReturnValue('Formatted results');
    });

    test('should return formatted results when search is successful', async () => {
        // Arrange
        const mockSearchResults = {
            items: [
                { name: 'repo1', description: 'Test repo 1', html_url: 'https://github.com/spryker/repo1' },
                { name: 'repo2', description: 'Test repo 2', html_url: 'https://github.com/spryker/repo2' }
            ],
            total_count: 2
        };

        githubClient.searchGitHubRepositories.mockResolvedValue(mockSearchResults);

        // Act
        const result = await searchSprykerPackages({
            query: 'test-query',
            organisations: ['spryker']
        });

        // Assert
        expect(utils.normalizeQuery).toHaveBeenCalledWith('test-query');
        expect(utils.validateOrganisations).toHaveBeenCalledWith(['spryker']);
        expect(utils.buildGitHubQuery).toHaveBeenCalledWith('test-query', ['spryker']);
        expect(githubClient.searchGitHubRepositories).toHaveBeenCalledWith('test-query org:spryker');
        expect(utils.formatResults).toHaveBeenCalledWith(mockSearchResults.items, ['spryker']);
        expect(result).toEqual({
            content: [{
                type: 'text',
                text: 'Formatted results'
            }]
        });
    });

    test('should handle errors and return error message', async () => {
        // Arrange
        const errorMessage = 'API error';
        githubClient.searchGitHubRepositories.mockRejectedValue(new Error(errorMessage));

        // Act
        const result = await searchSprykerPackages({
            query: 'test-query',
            organisations: ['spryker']
        });

        // Assert
        expect(result).toEqual({
            content: [{
                type: 'text',
                text: `Error performing search: ${errorMessage}`
            }]
        });
    });
});

describe('searchSprykerCode', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        utils.normalizeQuery.mockImplementation(query => query);
        utils.validateOrganisations.mockReturnValue(['spryker']);
        utils.buildGitHubQuery.mockReturnValue('test-query org:spryker');
        utils.formatCodeResults.mockReturnValue('Formatted code results');
    });

    test('should return formatted code results when search is successful', async () => {
        // Arrange
        const mockCodeResults = {
            items: [
                {
                    name: 'file1.php',
                    path: 'src/file1.php',
                    html_url: 'https://github.com/spryker/repo1/blob/main/src/file1.php',
                    repository: { full_name: 'spryker/repo1' }
                }
            ],
            total_count: 1
        };

        githubClient.searchGitHubCode.mockResolvedValue(mockCodeResults);

        // Act
        const result = await searchSprykerCode({
            query: 'test-query',
            organisations: ['spryker']
        });

        // Assert
        expect(utils.normalizeQuery).toHaveBeenCalledWith('test-query');
        expect(utils.validateOrganisations).toHaveBeenCalledWith(['spryker']);
        expect(utils.buildGitHubQuery).toHaveBeenCalledWith('test-query', ['spryker']);
        expect(githubClient.searchGitHubCode).toHaveBeenCalledWith('test-query org:spryker in:file language:php');
        expect(utils.formatCodeResults).toHaveBeenCalledWith(mockCodeResults.items, ['spryker']);
        expect(result).toEqual({
            content: [{
                type: 'text',
                text: 'Formatted code results'
            }]
        });
    });
});

describe('searchSprykerDocs', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        utils.normalizeQuery.mockImplementation(query => query);
        utils.formatDocsResults.mockReturnValue('Formatted docs results');
    });

    test('should return formatted docs results when search is successful', async () => {
        // Arrange
        const mockHits = [
            {
                url: 'https://docs.spryker.com/docs/pbc/all/some-page.html',
            }
        ];

        algolia.algoliaSearch.mockResolvedValue(mockHits);
        githubClient.getFileContentFromGitHubSprykerDocs.mockResolvedValue('# Some Markdown Content');

        // Act
        const result = await searchSprykerDocs({ query: 'test-query' });

        // Assert
        expect(utils.normalizeQuery).toHaveBeenCalledWith('test-query');
        expect(algolia.algoliaSearch).toHaveBeenCalledWith({ query: 'test-query' });
        expect(githubClient.getFileContentFromGitHubSprykerDocs).toHaveBeenCalledWith(
            '/docs/pbc/all/some-page.md'
        );
        expect(utils.formatDocsResults).toHaveBeenCalledWith([
            {
                url: 'https://docs.spryker.com/docs/pbc/all/some-page.html',
                text: '# Some Markdown Content'
            }
        ]);
        expect(result).toEqual({
            content: [{
                type: 'text',
                text: 'Formatted docs results'
            }]
        });
    });

    test('should return partial results when one fetch fails', async () => {
        const mockHits = [
            {
                url: 'https://docs.spryker.com/docs/pbc/all/first.html',
            },
            {
                url: 'https://docs.spryker.com/docs/pbc/all/second.html',
            }
        ];

        algolia.algoliaSearch.mockResolvedValue(mockHits);

        githubClient.getFileContentFromGitHubSprykerDocs
            .mockImplementationOnce(() => Promise.resolve('# First doc'))
            .mockImplementationOnce(() => Promise.reject(new Error('Not Found')));

        // Act
        await searchSprykerDocs({ query: 'test-query' });

        expect(utils.formatDocsResults).toHaveBeenCalledWith([
            {
                url: 'https://docs.spryker.com/docs/pbc/all/first.html',
                text: '# First doc'
            },
            {
                "error": "Not Found",
                "text": null,
                "url": "/docs/pbc/all/second.md",
            }
        ]);
    });

    test('should handle errors and return error message', async () => {
        const errorMessage = 'Algolia failed';
        algolia.algoliaSearch.mockRejectedValue(new Error(errorMessage));

        const result = await searchSprykerDocs({ query: 'test-query' });

        expect(result).toEqual({
            content: [{
                type: 'text',
                text: `Error performing docs search: ${errorMessage}`
            }]
        });
    });
});
