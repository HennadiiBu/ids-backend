import mongoose from "mongoose";

const dataSchema = new mongoose.Schema(
  {
    visitDate: { type: String, required: true },
    ttNumbers: {
      type: Map,
      of: [
        new mongoose.Schema(
          {
            orgStructureRSM: { type: String, required: true },
            orgStructureTSM: { type: String, required: true },
            orgStructureSUP: { type: String, required: true },
            orgStructureTP: { type: String, required: true },
            monthYear: { type: String },
            ttActualName: { type: String, required: true },
            ttCity: { type: String, required: true },
            ttActualAddress: { type: String, required: true },
            ttSubtype: { type: String, required: true },
            ttComment: { type: String },
            ttAdditionalId: { type: String },
            ttNetwork: { type: String },
            mrmMkk: { type: String },
            survey: { type: String },
            surveyPage: { type: String },
            surveyElement: { type: String },
            surveyAnswer: { type: String },
            surveyContentLink: { type: String },
            verified: { type: Boolean, default: false  },
            verifiedResult: { type: String },
          },
          { _id: false }
        ),
      ],
    },
  },
  { timestamps: true }
);

const DataModel = mongoose.model("Data", dataSchema);
export default DataModel;
