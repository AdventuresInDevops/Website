---
title: "Browser Native Auth and FedCM is finally here!"
description: "Sam Goto from Chrome talks us through the treacherous adventure of getting auth into browser land"
image: ./post.png
date: 2025-12-15
custom_youtube_embed_url: https://youtu.be/L36OxItF_c0
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';
import SponsorCallout from '@site/src/components/sponsorCallout';
import SponsorImage from './sponsor.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Sam Goto" link="https://www.linkedin.com/in/samuelgoto/" image={GuestImage} brandImg={BrandImage} />
    <SponsorCallout name="Incident.io" tagline="The AI incident platform" link="https://dev0ps.fyi/incidentio" image={SponsorImage} />
</div>

"My biggest legacy at Google is the amount of systems I broke." — Sam Goto joins the show with a name that strikes fear into engineering systems everywhere. As a Senior Staff Engineer on the Chrome team, Sam shares the hilarious reality of having the last name "Goto," which once took down Google's internal URL shortener for four hours simply because he plugged in a new computer.

Sam gets us up to speed with Federated Credentials Management (FedCM), as we dive deep into why authentication has been built despite the browser rather than with it, and why it’s time to move identity from "user-land" to "kernel-land". This shift allows for critical UX improvements for logging in all users irrespective of what login providers you use, finally addressing the "NASCAR flag" problem of infinite login lists.

Most importantly, he shares why you don't need to change your technology stack to get all the benefits of FedCM. Finally, Sam details the "self-sustaining flame" strategy (as opposed to an ecosystem "flamethrower"), revealing how they utilized JavaScript SDKs to migrate massive platforms like Shopify and 50% of the web's login traffic without requiring application developers to rewrite their code.

## 💡 Notable Links:
* [HSMs + TPM in production environments](https://authress.io/knowledge-base/academy/topics/credential-management#asymmetric-key-cryptography)
* [Get involved: FedCM W3C WG](https://www.w3.org/groups/wg/fedid/)
* [The FedCM spec GitHub repo](https://github.com/w3c-fedid/FedCM)
* [TPAC Browser Conference](https://www.w3.org/2025/11/TPAC/)

## 🎯 Picks:
* Warren - [Book: The Platform Revolution](https://amzn.to/4q5c3vl)
* Sam - [The 7 Laws of Identity](https://www.identityblog.com/?p=352) and [Short Story: The Egg By Andy Weir](https://www.galactanet.com/oneoff/theegg.html)