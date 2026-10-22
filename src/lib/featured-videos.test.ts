import {describe,expect,it} from "vitest";
import type {SiteContent} from "./data";
import {FEATURED_TIKTOK_VIDEOS,withFeaturedVideos} from "./featured-videos";
const empty={tiktokVideos:[],socialLinks:{tiktok:"",instagram:""}} as unknown as SiteContent;
describe("featured ministry video migration",()=>{
  it("seeds an old empty list with verified actual posts without mutating storage",()=>{
    const migrated=withFeaturedVideos(empty);
    expect(migrated.tiktokVideos).toEqual(FEATURED_TIKTOK_VIDEOS);
    expect(empty.tiktokVideos).toEqual([]);
    expect(migrated.featuredVideosInitialized).toBe(true);
  });
  it("keeps an existing selection and respects deliberately deleting the seeded videos",()=>{
    const selected=[{id:"own",url:"https://www.tiktok.com/@life/video/123",title:"Own selection"}];
    expect(withFeaturedVideos({...empty,tiktokVideos:selected}).tiktokVideos).toEqual(selected);
    expect(withFeaturedVideos({...withFeaturedVideos(empty),tiktokVideos:[]}).tiktokVideos).toEqual([]);
  });
});
