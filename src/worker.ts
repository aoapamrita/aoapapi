import { verifyingAllCandidatesWorker } from "./handlers/admin/vendor";

export const worker = async (job) => {
  if (job.name === "verifyAllCandidates") {
    verifyingAllCandidatesWorker(job.data);
  }
};
