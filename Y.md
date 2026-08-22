# Eidovara — robots.txt
# https://eidovara.org/robots.txt

User-agent: *
Allow: /

# Disallow private/admin paths
Disallow: /admin/
Disallow: /private/
Disallow: /internal/
Disallow: /api/
Disallow: /v1/

# Disallow utility files
Disallow: /_headers
Disallow: /_redirects
Disallow: /.well-known/
Disallow: /sw.js
Disallow: /manifest.json

# Crawl-delay for polite crawling
Crawl-delay: 10

# Sitemap location
Sitemap: https://eidovara.org/sitemap.xml

# Host preference
Host: https://eidovara.org