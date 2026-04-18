# The Unspoken Challenges of Deploying to Customer Clouds

**Date:** 2025-09-17
**URL:** https://adventuresindevops.com/episodes/2025/09/17/chosing-the-best-database-for-ml
**Description:** Andrew Moreland joins us to explain just why Chalk chose to deploy their data platform for ML into the customer cloud. Features utilizing time travel to prevent model bias and ASTs for running unsafe code.

[Transcript](https://links.adventuresindevops.com/storage/episodes/252/transcript.txt)

---

This episode we are joined by Andrew Moreland, co-founder of [Chalk](https://chalk.ai/). Andrew explains how their company's core business model is to deploy their software directly into their customers' cloud environments. This decision was driven by the need to handle highly sensitive data, like PII and financial records, that customers don't want to hand over to a third-party startup. 

The conversation delves into the surprising and complex challenges of this approach, which include managing granular IAM permissions and dealing with hidden global policies that can block their application. Andrew and Warren also discuss the real-world network congestion issues that affect cross-cloud traffic, a problem they've encountered multiple times. Andrew shares Chalk's mature philosophy on software releases, where they prioritize backwards compatibility to prevent customer churn, which is a key learning from a competitor.

Finally, the episode explores the advanced technical solutions Chalk has built, such as their unique approach to "bitemporal modeling" to prevent training bias in machine learning datasets. As well as, the decision to move from Python to C++ and Rust for performance, using a symbolic interpreter to execute customer code written in Python without a Python runtime. The episode concludes with picks, including a surprisingly popular hobby and a unique take on high-quality chocolate.

## 💡 Notable Links:
* Fact - [The $1M hidden Kubernetes spend](https://downloads.portainer.io/whitepapers/portainer-the-true-cost-of-kubernetes-platform-adoption.pdf)
* [Giraffe and Medical Ruler training data bias](https://www.bdo.com/insights/digital/unpacking-ai-bias#:~:text=Because%20diagnostic%20photos%2C%20like%20those,characteristic%20of%20malignant%20skin%20lesions.)
* [SOLID principles don't produce better code?](https://www.youtube.com/watch?v=tD5NrevFtbU)
* [Veritasium - The Hole at the Bottom of Math](https://www.youtube.com/watch?v=HeQX2HjkcNo)
* [Episode: Auth Showdown on backwards compatible changes](https://adventuresindevops.com/episodes/2025/07/17/auth-showdown-single-versus-multitenant-architecture/)

## 🎯 Picks:
* Warren - [Switzerland Grocery Store Chocolate](https://www.migros.ch/en/content/frey)
* Andrew - [Trek E-Bikes](https://www.trekbikes.com/)
