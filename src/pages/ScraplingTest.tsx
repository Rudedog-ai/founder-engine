// ScraplingTest.tsx
// Test page for OYNB - Shows Scrapling scraping results in real-time

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ScraplingResult {
  company: string;
  website: string;
  timestamp: string;
  sources: Record<string, any>;
  total_mentions: number;
  items: Array<{
    source: string;
    type: string;
    title?: string;
    content?: string;
    url: string;
  }>;
}

export default function ScraplingTest() {
  const [companyName, setCompanyName] = useState('OYNB');
  const [website, setWebsite] = useState('oynb.co.uk');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScraplingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScraping() {
    setLoading(true);
    setError(null);
    
    try {
      // Call Supabase edge function that runs Python script
      const { data, error: funcError } = await supabase.functions.invoke('run-scrapling', {
        body: {
          company_name: companyName,
          website: website
        }
      });

      if (funcError) throw funcError;

      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Scraping failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 Scrapling Test - Social Media & PR Intelligence
          </h1>
          <p className="text-gray-600">
            Test Scrapling's ability to find company mentions across Twitter, LinkedIn, Google News, and blogs
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="OYNB"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website (optional)
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="oynb.co.uk"
              />
            </div>
          </div>

          <button
            onClick={runScraping}
            disabled={loading || !companyName}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Scraping... (may take 30-60 seconds)
              </span>
            ) : (
              'Run Scraping Test'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{results.total_mentions}</div>
                  <div className="text-sm text-gray-600">Total Mentions</div>
                </div>
                
                {Object.entries(results.sources).map(([source, data]: [string, any]) => (
                  <div key={source} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {data.count || 0}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{source.replace('_', ' ')}</div>
                    {data.found ? (
                      <span className="inline-block mt-2 text-xs text-green-600">✓ Found</span>
                    ) : (
                      <span className="inline-block mt-2 text-xs text-gray-400">Not found</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                Scraped at: {new Date(results.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Grouped Results */}
            {['twitter', 'linkedin', 'google_news', 'company_blog'].map(source => {
              const sourceItems = results.items.filter(item => item.source === source);
              if (sourceItems.length === 0) return null;

              return (
                <div key={source} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize flex items-center">
                    {source === 'twitter' && '🐦 Twitter/X'}
                    {source === 'linkedin' && '💼 LinkedIn'}
                    {source === 'google_news' && '📰 Google News'}
                    {source === 'company_blog' && '📝 Company Blog'}
                    <span className="ml-3 text-sm font-normal text-gray-500">
                      ({sourceItems.length} mentions)
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {sourceItems.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                        {item.title && (
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        )}
                        {item.content && (
                          <p className="text-gray-700 text-sm mb-2">{item.content}</p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            View source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Raw JSON (for debugging) */}
            <details className="bg-gray-100 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700">
                Raw JSON Results (for debugging)
              </summary>
              <pre className="mt-4 text-xs text-gray-600 overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* No results yet */}
        {!results && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ready to scrape!
            </h3>
            <p className="text-gray-500">
              Enter a company name above and click "Run Scraping Test" to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
