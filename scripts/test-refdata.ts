import { matchCampaignByAmount } from './src/lib/reference-data.ts';

console.log("Testing amount 68:");
console.log(matchCampaignByAmount("100068"));
console.log(matchCampaignByAmount("500068"));
console.log("Testing amount 100:");
console.log(matchCampaignByAmount("100"));
