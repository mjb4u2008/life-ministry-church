import type {SiteContent,TikTokVideo} from "./data";

// Verified on the ministry's public TikTok profile on 2026-10-22.
// These seed the previously empty media list; the pastor can replace or remove
// them in Messages & media. This is a selection, not a live account sync.
export const FEATURED_TIKTOK_PROFILE="https://www.tiktok.com/@l.i.f.e.ministry";
export const FEATURED_TIKTOK_VIDEOS:TikTokVideo[]=[
  {id:"7683384185838374174",url:FEATURED_TIKTOK_PROFILE+"/video/7683384185838374174",title:"Jesus, the head of our life"},
  {id:"7636588562930044190",url:FEATURED_TIKTOK_PROFILE+"/video/7636588562930044190",title:"A relationship with Jesus"},
  {id:"7621790450873093406",url:FEATURED_TIKTOK_PROFILE+"/video/7621790450873093406",title:"The perfect love letter"},
];

export function withFeaturedVideos(content:SiteContent):SiteContent{
  if(content.featuredVideosInitialized)return content;
  return {...content,featuredVideosInitialized:true,
    tiktokVideos:content.tiktokVideos?.length?content.tiktokVideos:FEATURED_TIKTOK_VIDEOS.map(video=>({...video})),
    socialLinks:{...content.socialLinks,tiktok:content.socialLinks?.tiktok||FEATURED_TIKTOK_PROFILE},
  };
}
