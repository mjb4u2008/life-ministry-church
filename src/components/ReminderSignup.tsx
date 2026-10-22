"use client";
import {useId,useState} from "react";
import {ArrowUpRight,Check} from "lucide-react";
export function ReminderSignup({signupContext="reminder-form"}:{signupContext?:string}){
  const id=useId();
  const [name,setName]=useState(""),[contact,setContact]=useState(""),[channel,setChannel]=useState<"email"|"phone">("email");
  const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState("");
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(!consent||busy)return;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/subscribers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),contactType:channel,contact:contact.trim(),consent,signupContext}),signal:AbortSignal.timeout(12000)});
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"We couldn’t save your reminder. Please try again.");
      setSuccess(true);
    }catch(failure){setError(failure instanceof Error&&failure.name!=="TimeoutError"?failure.message:"The connection took too long. Please try again.");}finally{setBusy(false);}
  };
  if(success)return <div className="renewal-reminder-success" role="status"><Check size={28}/><h3>You’re on the list.</h3><p>Thanks for making room for the Word. You can opt out at any time.</p></div>;
  return <form className="renewal-reminder-form" onSubmit={submit}>
    <div className="renewal-reminder-toggle" role="group" aria-label="Reminder method"><button type="button" aria-pressed={channel==="email"} onClick={()=>{setChannel("email");setContact("");}}>Email</button><button type="button" aria-pressed={channel==="phone"} onClick={()=>{setChannel("phone");setContact("");}}>Text me</button></div>
    <div className="renewal-reminder-inputs"><div><label htmlFor={id+"-name"}>Name</label><input id={id+"-name"} autoComplete="given-name" maxLength={100} required value={name} onChange={event=>setName(event.target.value)} placeholder="Your name"/></div><div><label htmlFor={id+"-contact"}>{channel==="email"?"Email":"Phone number"}</label><input id={id+"-contact"} type={channel==="email"?"email":"tel"} autoComplete={channel==="email"?"email":"tel"} required value={contact} onChange={event=>setContact(event.target.value)} placeholder={channel==="email"?"you@example.com":"Your phone number"}/></div></div>
    <label className="renewal-consent"><input type="checkbox" checked={consent} required onChange={event=>setConsent(event.target.checked)}/><span>I agree to receive gathering reminders from L.I.F.E. Ministry by {channel==="email"?"email":"text"}. I can opt out anytime.</span></label>
    {error&&<p className="renewal-form-error" role="alert">{error}</p>}
    <button className="renewal-primary" type="submit" disabled={busy}>{busy?"Saving your reminder…":"Remind me"}<ArrowUpRight size={18}/></button>
  </form>;
}
