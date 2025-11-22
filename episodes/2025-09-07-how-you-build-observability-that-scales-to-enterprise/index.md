---
title: "How to build in Observability at Petabyte Scale"
description: "Ang Li, Director of Engineering at Observe, shares how they built a petabyte-scale observability platform using Snowflake, Kafka, and open data formats."
image: ./post.jpg
date: 2025-09-07
custom_youtube_embed_url: https://youtu.be/Sp_UBqZE8jI
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<GuestCallout name="Ang Li " link="https://www.linkedin.com/in/angliphd/" image={GuestImage} brandImg={BrandImage} />

We welcome guest Ang Li and dive into the immense challenge of observability at scale, where some customers are generating petabytes of data per day. Ang explains that instead of building a database from scratch—a decision he says went "against all the instincts" of a founding engineer—Observe chose to build its platform on top of Snowflake, leveraging its separation of compute and storage on EC2 and S3.

The discussion delves into the technical stack and architectural decisions, including the use of Kafka to absorb large bursts of incoming customer data and smooth it out for Snowflake's batch-based engine. Ang notes this choice was also strategic for avoiding tight coupling with a single cloud provider like AWS Kinesis, which would hinder future multi-cloud deployments on GCP or Azure. The discussion also covers their unique pricing model, which avoids surprising customers with high bills by providing a lower cost for data ingestion and then using a usage-based model for queries. This is contrasted with Warren's experience with his company's user-based pricing, which can lead to negative customer experiences when limits are exceeded.

The episode also explores Observe's "love-hate relationship" with Snowflake, as Observe's usage accounts for over 2% of Snowflake's compute, which has helped them discover a lot of bugs but also caused sleepless nights for Snowflake's on-call engineers. Ang discusses hedging their bets for the future by leveraging open data formats like Iceberg, which can be stored directly in customer S3 buckets to enable true data ownership and portability. The episode concludes with a deep dive into the security challenges of providing multi-account access to customer data using IAM trust policies, and a look at the personal picks from the hosts.

## Notable Links
* Fact - [Passkeys: Phishing on Google's own domain](https://www.adaptivesecurity.com/blog/gmail-phishing-google-sites-scam) and [It isn't even new](https://mashable.com/article/google-sites-phishing-scams)
* [Episode: All About OTEL](https://adventuresindevops.com/episodes/everything-is-amazing-with-otel/)
* [Episode: Self Healing Systems](https://adventuresindevops.com/episodes/self-healing-systems/)

## 🎯 Picks:
* Warren - [The Shadow (1994 film)](https://www.imdb.com/title/tt0111143/)
* Ang - [XREAL Pro AR Glasses](https://www.xreal.com/air/)