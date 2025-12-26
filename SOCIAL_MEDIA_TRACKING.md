# Social Media Tracking Guide

## ✨ What's New

Your website now automatically tracks where visitors come from, including social media platforms!

## 📱 Tracked Social Media Platforms

- **Facebook** (facebook.com, fb.com)
- **Instagram** (instagram.com)
- **Twitter/X** (twitter.com, x.com)
- **LinkedIn** (linkedin.com)
- **TikTok** (tiktok.com)
- **YouTube** (youtube.com)
- **Pinterest** (pinterest.com)
- **Snapchat** (snapchat.com)
- **WhatsApp** (whatsapp.com, wa.me)
- **Telegram** (telegram.org, t.me)

## 🔍 Other Traffic Sources

- **Search Engines**: Google, Bing, Yahoo, DuckDuckGo
- **Direct**: When someone types your URL directly
- **Referrals**: Other websites linking to you

## 📊 How It Works

1. **Automatic Detection**: When someone visits your site, the system checks:
   - URL parameters (utm_source)
   - Referrer URL
   - Session data

2. **Tracking Logic**:
   - First time in browser session = counted as new visit
   - Source is recorded (e.g., "Facebook", "Instagram")
   - Data stored in browser localStorage

3. **Reports Dashboard**: View traffic breakdown in **Reports & Analytics** page

## 🎯 How to Track Campaigns

### Method 1: Share Links with UTM Parameters

Add `?utm_source=` to your links:

**Instagram:**
```
https://spirithubcafe.com?utm_source=Instagram
https://spirithubcafe.com/products?utm_source=Instagram_Story
```

**Facebook:**
```
https://spirithubcafe.com?utm_source=Facebook
https://spirithubcafe.com?utm_source=Facebook_Ad_Campaign
```

**TikTok:**
```
https://spirithubcafe.com?utm_source=TikTok
https://spirithubcafe.com?utm_source=TikTok_Video_123
```

### Method 2: Use Link Shorteners

1. Create a shortened link (bit.ly, tinyurl.com)
2. Add UTM parameter: `?utm_source=YourSource`
3. Share the shortened link
4. Track results in Reports & Analytics

## 📈 View Your Data

Go to: **Admin Panel → Reports & Analytics**

You'll see:
- **Traffic Sources Card**: Breakdown of all visits
- **Social Media Section**: All social platform visits
- **Other Sources Section**: Search engines, direct, etc.
- **Percentages**: Shows what % of traffic comes from each source

## 🔄 Example Results

```
Traffic Sources
├── Social Media (45 visits)
│   ├── Instagram: 20 visits (44%)
│   ├── Facebook: 15 visits (33%)
│   └── WhatsApp: 10 visits (22%)
│
└── Other Sources (55 visits)
    ├── Google Search: 30 visits (55%)
    ├── Direct: 20 visits (36%)
    └── Other: 5 visits (9%)
```

## 💡 Best Practices

1. **Use UTM Parameters** for specific campaigns
2. **Create unique links** for different posts/ads
3. **Track regularly** to see which platforms work best
4. **Test different content** on different platforms

## 🎨 Sharing Tips

### Instagram:
- Link in bio: `spirithubcafe.com?utm_source=Instagram_Bio`
- Stories: `spirithubcafe.com?utm_source=Instagram_Story`

### Facebook:
- Posts: `spirithubcafe.com?utm_source=Facebook_Post`
- Ads: `spirithubcafe.com?utm_source=Facebook_Ad`

### WhatsApp:
- Business status: `spirithubcafe.com?utm_source=WhatsApp_Status`
- Messages: Share direct link (auto-tracked as WhatsApp)

## ⚙️ Technical Details

**Storage**: Browser localStorage (survives page refreshes)
**Session**: Browser sessionStorage (resets when tab closes)
**Privacy**: No personal data collected, just source counting

## 🚀 Upgrade Path

For more advanced analytics, consider:
- **Google Analytics**: Free, comprehensive
- **Facebook Pixel**: Track conversions from ads
- **Instagram Insights**: Native platform analytics
- **Plausible**: Privacy-friendly alternative

---

**Note**: Current implementation is basic and browser-based. For production tracking at scale, integrate a professional analytics service.
