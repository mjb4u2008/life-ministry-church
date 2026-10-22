import {cleanup,render,screen} from "@testing-library/react";
import {afterEach,describe,expect,it} from "vitest";
import type {PublicGatheringOccurrence,PublicGatheringsResponse} from "@/lib/gatherings";
import {currentPublicGathering} from "./GatheringExperience";
import {GatheringHero,getGatheringPhase} from "./GatheringHero";
import {GatheringActions} from "./GatheringActions";
import {isPublicGatheringsResponse,nextGatheringRefresh} from "./useGatherings";

const sunday:PublicGatheringOccurrence={id:"sunday",seriesId:"sunday-worship",localDate:"2026-10-25",startsAt:"2026-10-25T15:30:00.000Z",endsAt:"2026-10-25T17:00:00.000Z",status:"published",title:"Sunday Hope",scripture:"John 10:10",description:"",joinUrl:"https://meet.google.com/abc-defg-hij"};
const wednesday:PublicGatheringOccurrence={...sunday,id:"wednesday",seriesId:"wednesday-word",localDate:"2026-10-28",startsAt:"2026-10-28T23:30:00.000Z",endsAt:"2026-10-29T01:30:00.000Z",title:"Wednesday Word",joinUrl:undefined};
const nextSunday={...sunday,id:"next-sunday",localDate:"2026-11-01",startsAt:"2026-11-01T16:30:00.000Z",endsAt:"2026-11-01T18:00:00.000Z",joinUrl:undefined};
const payload:PublicGatheringsResponse={series:[],featured:sunday,upcoming:[wednesday,nextSunday],recent:[],generatedAt:"2026-10-25T16:59:00.000Z"};
afterEach(cleanup);
describe("renewal public gathering boundaries",()=>{
  it("switches from Sunday at 1 PM to Wednesday, then back to Sunday at Wednesday end without waiting for a poll",()=>{
    expect(currentPublicGathering(payload,new Date("2026-10-25T16:59:59Z"))?.id).toBe("sunday");
    expect(currentPublicGathering(payload,new Date("2026-10-25T17:00:00Z"))?.id).toBe("wednesday");
    expect(currentPublicGathering(payload,new Date("2026-10-29T01:30:00Z"))?.id).toBe("next-sunday");
  });
  it("does not let a stale live flag or old join URL outlive the session",()=>{
    const now=new Date("2026-10-25T17:00:00Z");
    expect(getGatheringPhase({...sunday,status:"live"},now)).toBe("ended");
    render(<GatheringActions occurrence={{...sunday,status:"live"}} now={now}/>);
    expect(screen.queryByRole("link",{name:/join on google meet/i})).toBeNull();
  });
  it("renders live joining and never says the live gathering ended",()=>{
    render(<GatheringHero occurrence={sunday} now={new Date("2026-10-25T16:00:00Z")}/>);
    expect(screen.getByText("Live now")).toBeVisible();
    expect(screen.getByRole("link",{name:/join us live/i})).toHaveAttribute("href",sunday.joinUrl);
    expect(screen.queryByText(/this gathering has ended/i)).toBeNull();
  });
  it("refreshes near the room opening and rejects malformed timed records",()=>{
    const data={...payload,featured:wednesday,upcoming:[wednesday]};
    expect(nextGatheringRefresh(data,Date.parse(wednesday.startsAt)-30*60000-1000)).toBe(1050);
    expect(isPublicGatheringsResponse({...data,featured:{id:"broken",startsAt:"bad",endsAt:"bad"}})).toBe(false);
  });
});
