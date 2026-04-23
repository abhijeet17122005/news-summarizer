import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
// Cache feed for 10 minutes (600 seconds) to avoid spamming RSS sources
export const revalidate = 600;

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure']
    ]
  }
});

const RSS_FEEDS = [
  { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  { name: 'Fox News', url: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { name: 'CNN Top', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
];

export async function GET() {
  try {
    const allArticles: any[] = [];

    const fetchPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const feedData = await parser.parseURL(feed.url);
        
        feedData.items?.slice(0, 8).forEach(item => {
          // Extract an image if possible (RSS formats vary widely)
          let imageUrl = null;
          
          if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image')) {
            imageUrl = item.enclosure.url;
          } else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
            imageUrl = item.mediaContent.$.url;
          } else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
             imageUrl = item.mediaThumbnail.$.url;
          } else if (item.content || (item as any)['content:encoded']) {
            const htmlContent = (item as any)['content:encoded'] || item.content || '';
            const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) imageUrl = imgMatch[1];
          }

          allArticles.push({
            id: item.guid || item.link || Math.random().toString(),
            title: item.title?.trim() || 'No Title',
            link: item.link,
            pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
            source: feed.name,
            snippet: (item.contentSnippet || item.summary || '').substring(0, 150).trim() + '...',
            imageUrl: imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(feed.name)}&background=random&size=400`
          });
        });
      } catch (err) {
        console.error(`Failed to fetch RSS from ${feed.name}:`, err);
      }
    });

    await Promise.all(fetchPromises);

    // Sort all combined articles by date descending
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({ articles: allArticles.slice(0, 40) });
  } catch (error: any) {
    console.error('Feed Error:', error);
    return NextResponse.json({ error: 'Failed to fetch news feeds' }, { status: 500 });
  }
}
