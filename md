{
  "name": "Eidovara",
  "short_name": "Eidovara",
  "description": "Eidovara v1.0.0 — Local-first Windows desktop workspace with media, internet research, optional Soul layer, persistent continuity, custom themes, and gaming mode. 18+ restricted source-available software.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "portrait-primary",
  "background_color": "#f2f2f7",
  "theme_color": "#007aff",
  "theme_color_light": "#007aff",
  "theme_color_dark": "#0a84ff",
  "lang": "en",
  "dir": "ltr",
  "icons": [
    {
      "src": "eidovara-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "eidovara-icon.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "eidovara-mark.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "eidovara-icon.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "eidovara-icon.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "eidovara-icon.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "eidovara-icon.png",
      "sizes": "48x48",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "categories": ["productivity", "utilities", "developer"],
  "shortcuts": [
    {
      "name": "Download Eidovara",
      "short_name": "Download",
      "description": "Download Eidovara v1.0.0 (18+)",
      "url": "/download.html",
      "icons": [{ "src": "eidovara-icon.png", "sizes": "192x192" }]
    },
    {
      "name": "Product Features",
      "short_name": "Product",
      "description": "View product features and capabilities",
      "url": "/product.html",
      "icons": [{ "src": "eidovara-mark.png", "sizes": "192x192" }]
    },
    {
      "name": "Service Status",
      "short_name": "Status",
      "description": "Check Eidovara service status",
      "url": "/status.html",
      "icons": [{ "src": "eidovara-icon.png", "sizes": "192x192" }]
    }
  ],
  "screenshots": [
    {
      "src": "eidovara-wallpaper-product.jpg",
      "sizes": "1920x1080",
      "type": "image/jpeg",
      "form_factor": "wide",
      "label": "Eidovara Dashboard"
    },
    {
      "src": "eidovara-og.png",
      "sizes": "1200x630",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Eidovara Overview"
    }
  ],
  "prefer_related_applications": false,
  "related_applications": [],
  "iarc_rating_id": "e8a9b2c1-4f3d-4a5b-9c8d-1e2f3a4b5c6d",
  "protocol_handlers": [],
  "file_handlers": [],
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "audio/*", "video/*"]
        }
      ]
    }
  }
}