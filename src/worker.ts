import {
  sendingSlotBulkMail,
  verifyingAllCandidatesWorker,
} from "./handlers/admin/vendor";
import { syncingOmrCandidates } from "./handlers/omr";

export const worker = async (job) => {
  if (job.name === "verifyAllCandidates") {
    verifyingAllCandidatesWorker(job.data);
  }
  if (job.name === "sendSlotMailBulk") {
    sendingSlotBulkMail(job.data);
  }
  if (job.name === "syncingOmrCandidates") {
    syncingOmrCandidates(job.data);
  }
};
