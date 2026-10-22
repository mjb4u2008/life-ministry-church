import {ArrowUpRight} from "lucide-react";
import {MINISTRY_TIMEZONE,type PublicGatheringOccurrence,type PublicGatheringSeries} from "@/lib/gatherings";
export function formatGatheringDate(startsAt:string,timezone=MINISTRY_TIMEZONE):string{
  return new Intl.DateTimeFormat("en-US",{timeZone:timezone,weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(startsAt));
}
export function GatheringCard({occurrence,series}:{occurrence:PublicGatheringOccurrence;series?:PublicGatheringSeries}){
  return <article className="renewal-message"><p>{series?.name??"L.I.F.E. Gathering"}</p><h3>{occurrence.title||series?.name||"Upcoming gathering"}</h3>{occurrence.scripture&&<p className="mt-3">{occurrence.scripture}</p>}<p className="renewal-message-date">{occurrence.dateUnknown?"Recorded message":formatGatheringDate(occurrence.startsAt)}</p>{occurrence.description&&<p className="mt-4">{occurrence.description}</p>}{occurrence.replayUrl?<a className="renewal-text-link" href={occurrence.replayUrl} target="_blank" rel="noopener noreferrer">Watch replay <ArrowUpRight size={17}/></a>:<a className="renewal-text-link" href="/watch#reminded">Get a reminder <ArrowUpRight size={17}/></a>}</article>;
}
