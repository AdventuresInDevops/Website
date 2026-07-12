---
title: "There's no way it's DNS..."
description: "How much do you know about the protocol that everything is built upon? Simone Carletti talks about abstractions, standards, and the joy of DNS."
image: ./post.png
date: 2026-03-20
episode_number: 266
custom_youtube_embed_url: https://youtu.be/kfxS_YgMwi4
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Simone Carletti" link="https://www.linkedin.com/in/weppos/" image={GuestImage} brandImg={BrandImage} />
</div>

How much do you really know about the protocol that everything is built upon? This week, we go behind the scenes with Simone Carletti, a 13-year industry veteran and CTO at [DNSimple](https://dnsimple.com/), to explore the hidden complexities of DNS. We attempt to uncover why exactly DNS is often the last place developers check during an outage, drawing fascinating parallels between modern web framework abstractions and network-level opaqueness.

Simone shares why his team relies on bare-metal machines instead of cloud providers to run their Erlang-based authoritative name servers, highlighting the critical need to control BGP routing. We trade incredible war stories, from Facebook locking themselves out of their own data centers due to a BGP error, to a massive 2014 DDoS attack that left DNSimple unable to access their own log aggregation service. The conversation also tackles the reality of implementing new standards like SVCB and HTTPS records, and why widespread DNSSEC adoption might require an industry-wide mandate.

And of course we have the picks, but I'm not spoiling this weeks, just yet...

## 💡 Notable Links:
* [Episode: IPv6](https://adventuresindevops.com/episodes/265-ipv6-improving-networking-cheaply)
* [SVCB + HTTPS DNS Resource Records RFC 9460](https://www.rfc-editor.org/rfc/rfc9460#name-overview-of-the-svcb-rr)
* [Avian Carrier RFC 1149](https://datatracker.ietf.org/doc/html/rfc1149)

## 🎯 Picks:
* Warren - [Book: One Second After](https://amzn.to/40GkhQ7)
* Simone - [Recommended diving locations in Italy](https://www.padi.com/diving-in/italy/) and [Wreck diving projects](https://sdss.blue/projects/)