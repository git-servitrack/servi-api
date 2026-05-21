declare module "ml-cart" {
  export interface DecisionTreeOptions {
    gainFunction?: "gini";
    splitFunction?: "mean";
    minNumSamples?: number;
    maxDepth?: number;
  }

  export class DecisionTreeClassifier {
    constructor(options?: DecisionTreeOptions, model?: unknown);
    train(trainingSet: number[][], predictions: number[]): void;
    predict(dataset: number[][]): number[];
    toJSON(): Record<string, unknown>;
    static load(model: Record<string, unknown>): DecisionTreeClassifier;
  }
}
