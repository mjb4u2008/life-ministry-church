import {GatheringExperience} from "@/components/gatherings";
import {ReminderSignup} from "@/components/ReminderSignup";
export default function WatchPage(){
  return <main className="renewal-watch"><GatheringExperience mode="watch"/><section className="renewal-reminders" id="reminded"><div className="renewal-container renewal-reminder-grid"><div><h2>See you at<br/>the next gathering.</h2><p>Wednesday evenings and Sunday mornings. A little reminder to make room for faith, wherever you are.</p></div><ReminderSignup/></div></section></main>;
}
