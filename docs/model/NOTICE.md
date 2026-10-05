# Handwritten digit model

Model: ONNX Model Zoo MNIST-12, trained on MNIST with Microsoft CNTK.
Source and model-specific MIT license declaration:
https://github.com/onnx/models/tree/main/validated/vision/classification/mnist

Training source:
https://github.com/microsoft/CNTK/blob/master/Tutorials/CNTK_103D_MNIST_ConvolutionalNeuralNetwork.ipynb

`weights.json` contains the original learned float32 weights converted from ONNX to JSON on 2026-10-05. No retraining or weight changes were performed. The original file SHA-256 is recorded in that JSON. `digit-model.js` implements this model's inference in JavaScript; it does not require an external inference service. See CNTK-MIT-LICENSE.txt. The repository-level Apache license is included as ONNX-APACHE-LICENSE.txt as well.

`examples.json` contains ten examples, one per digit, from the MNIST test split, with their original test-set indices. The labels are displayed as example labels and are not supplied to the predictor.
Dataset: https://storage.googleapis.com/cvdf-datasets/mnist/
MNIST provenance: https://www.tensorflow.org/datasets/catalog/mnist

MNIST has 28 × 28 grayscale images; foreground values range from 0 to 1. A user-drawn digit is cropped, scaled into a 20 × 20 area with its aspect ratio preserved, and shifted toward the image center of mass. Human handwriting in this canvas can differ from the model's training data. The displayed Softmax values are the model's relative scores, not a measured success rate or a guarantee.
