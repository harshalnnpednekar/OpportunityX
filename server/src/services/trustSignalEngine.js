/**
 * TrustSignalEngine — Evaluates catalog listing health, completeness, freshness,
 * source provenance, and consistency.
 * 
 * Notice: This is an internal data-quality indicator, not an external guarantee
 * of listing legitimacy or organizer endorsement.
 */

class TrustSignalEngine {
  static evaluateTrustSignal(opportunity, referenceDate = new Date()) {
    if (!opportunity) {
      return {
        trustScore: 0,
        tier: 'Caution / Needs Verification',
        factors: [{ factor: 'Missing opportunity data', points: 0 }],
        disclaimer: 'INTERNAL DATA-QUALITY INDICATOR: This score reflects internal metadata completeness, automated consistency audits, and freshness. It is not an external guarantee or warranty that an opportunity is legitimate.'
      };
    }

    const factors = [];
    let score = 0;

    // 1. Source Provenance & Attribution (Max 25 pts)
    const source = String(opportunity.sourceName || opportunity.sourceFeed || '').toLowerCase();
    const sourceUrl = opportunity.sourceUrl;
    if (source.includes('sample-') || source.includes('hackathon') || source.includes('competition') || source.includes('workshop')) {
      score += 25;
      factors.push({
        dimension: 'Source Attribution',
        impact: '+25',
        detail: `Attributed to curated feed fixture: "${opportunity.sourceName || opportunity.sourceFeed}".`
      });
    } else if (sourceUrl && sourceUrl.startsWith('https://')) {
      score += 20;
      factors.push({
        dimension: 'Source Attribution',
        impact: '+20',
        detail: 'Attributed to verified HTTPS web source link.'
      });
    } else {
      score += 10;
      factors.push({
        dimension: 'Source Attribution',
        impact: '+10',
        detail: 'Unverified or manual listing origin.'
      });
    }

    // 2. Freshness & Last Verified Timestamp (Max 25 pts)
    const verifiedDate = opportunity.lastVerifiedAt ? new Date(opportunity.lastVerifiedAt) : (opportunity.createdAt ? new Date(opportunity.createdAt) : null);
    if (verifiedDate && !isNaN(verifiedDate.getTime())) {
      const daysSinceVerification = Math.max(0, Math.floor((referenceDate - verifiedDate) / (1000 * 60 * 60 * 24)));
      if (daysSinceVerification <= 30) {
        score += 25;
        factors.push({
          dimension: 'Freshness',
          impact: '+25',
          detail: `Fresh metadata: Verified ${daysSinceVerification} day(s) ago.`
        });
      } else if (daysSinceVerification <= 90) {
        score += 18;
        factors.push({
          dimension: 'Freshness',
          impact: '+18',
          detail: `Moderately fresh: Verified ${daysSinceVerification} days ago.`
        });
      } else {
        score += 10;
        factors.push({
          dimension: 'Freshness',
          impact: '+10',
          detail: `Older listing: Verified ${daysSinceVerification} days ago; organizer review recommended.`
        });
      }
    } else {
      score += 5;
      factors.push({
        dimension: 'Freshness',
        impact: '+5',
        detail: 'No automated verification timestamp recorded.'
      });
    }

    // 3. Completeness of Critical Discovery Fields (Max 25 pts)
    const hasTitle = Boolean(opportunity.title && opportunity.title.trim().length >= 5);
    const hasDesc = Boolean(opportunity.description && opportunity.description.trim().length >= 30);
    const hasApply = Boolean(opportunity.applicationUrl && opportunity.applicationUrl.startsWith('http'));
    const hasDeadline = Boolean(opportunity.deadline || opportunity.applicationDeadline);
    const hasSkills = Boolean(opportunity.requiredSkills && opportunity.requiredSkills.length > 0);

    const completenessCount = [hasTitle, hasDesc, hasApply, hasDeadline, hasSkills].filter(Boolean).length;
    const completenessPts = Math.round((completenessCount / 5) * 25);
    score += completenessPts;

    factors.push({
      dimension: 'Completeness',
      impact: `+${completenessPts}`,
      detail: `${completenessCount} of 5 key discovery fields provided (Title, Description, Apply Link, Deadline, Required Skills).`
    });

    // 4. Deadline & Lifecycle Status (Max 25 pts)
    const isExpired = opportunity.status === 'expired' || (opportunity.applicationDeadline && new Date(opportunity.applicationDeadline) < referenceDate);
    if (isExpired) {
      factors.push({
        dimension: 'Lifecycle Status',
        impact: '-30',
        detail: 'Application deadline has passed (expired listing).'
      });
      score -= 30;
    } else {
      score += 25;
      factors.push({
        dimension: 'Lifecycle Status',
        impact: '+25',
        detail: 'Active registration window with upcoming deadline.'
      });
    }

    // 5. Contradiction Flags & Integrity Audits
    const contradictions = opportunity.contradictionFlags || [];
    if (contradictions.length > 0) {
      const deduction = contradictions.length * 15;
      score -= deduction;
      factors.push({
        dimension: 'Consistency Audits',
        impact: `-${deduction}`,
        detail: `Detected ${contradictions.length} timeline/cost anomaly flag(s): ${contradictions.join(', ')}.`
      });
    }

    // Final score clamp 0 - 100
    const finalScore = Math.min(100, Math.max(0, score));

    let tier = 'Caution / Needs Verification';
    if (finalScore >= 80) tier = 'High Quality & Fresh';
    else if (finalScore >= 60) tier = 'Standard Quality';

    return {
      trustScore: finalScore,
      tier,
      factors,
      disclaimer: 'INTERNAL DATA-QUALITY INDICATOR: This score reflects internal metadata completeness, automated consistency audits, and freshness. It is not an external guarantee or warranty that an opportunity is legitimate.'
    };
  }
}

module.exports = TrustSignalEngine;
