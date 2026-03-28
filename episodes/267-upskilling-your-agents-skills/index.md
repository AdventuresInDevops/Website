---
title: "Upskilling your agents"
description: "Dan Wahlin rom Microsoft joins us to talk about agentic coding, deploying to the cloud and agent security."
image: ./post.png
date: 2026-03-28
custom_youtube_embed_url: https://youtu.be/RdGoyoEXtoA
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Dan Wahlin" link="https://www.linkedin.com/in/danwahlin/" image={GuestImage} brandImg={BrandImage} />
</div>

In this adventure, we sit down with Dan Wahlin, Principal of DevRel for JavaScript, AI, and Cloud at Microsoft, to explore the complexities of modern infrastructure. We examine how cloud platforms like Azure function as "building blocks". Which of course, can quickly become overwhelming without the right instruction manuals. To bridge this gap, one potential solution we discuss is the emerging reliance on AI "skills"—specialized markdown files. They can give coding agents the exact knowledge needed to deploy poorly documented complex open-source projects to container apps without requiring deep infrastructure expertise. 

And we are saying the silent part outloud, as we review how handing the keys over to autonomous agents introduces terrifying new attack vectors. It's the security nightmare of prompt injections and the careless execution of unvetted AI skills. Which is a blast from the past, and we reminisce how current downloading of random agent instructions to running untrusted executables from early internet sites. While tools like OpenClaw purport to offer incredible automation, such as allowing agents to scour the internet and execute code without human oversight, it's already led us to disastrous leaks of API keys. We emphasize the critical necessity of validating skills through trusted repositories where even having agents perform security reviews on the code before execution is not enough.

Finally, we tackle the philosophical debate around AI productivity and why Dorota's [LLMs raise the floor and not the ceiling](https://dorotaparad.ch/aiaiaiaiai/) is so spot on. The standout pick requires mentioning, a fascinating 1983 paper titled "Ironies of Automation" by Lisanne Bainbridge. This paper perfectly predicts our current dilemma: automating systems often leaves the most complex, difficult tasks to human operators, proving that as automation scales, the need for rigorous human monitoring actually increases, destroying the very value that was attempting to be captured by the original innovation.


## 💡 Notable Links:
* [Agent Skill Marketplace](https://github.com/trailofbits/skills)
* [AI Fatigue is real](https://archive.ph/20260323121648/https://hbr.org/2026/03/when-using-ai-leads-to-brain-fry)
* [Episode: Does Productivity even exist?](https://adventuresindevops.com/episodes/262-engineering-productivity-delusion-gizmos-resentment-metrics)

## 🎯 Picks:
* Warren - [Paper: Ironies of Automation (& AI)](https://static1.squarespace.com/static/644321e78cd2dd37613af33e/t/6694873f71612132a84371c7/1721009983702/Ironies+of+Automation_Bainbridge_1983.pdf)
* Dan - [Tool: SkillShare](https://github.com/runkids/skillshare)
