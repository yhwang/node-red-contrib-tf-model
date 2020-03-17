## Object Detection Example Flow
This example flow use COCO-SSD model to perform object detection and annotate
the image with bounding boxes.

### Create Self Signed Certificate
In order to access the camera inside a browser, the Node-RED shall run
on HTTPS. The following steps use `openssl` utility to create a privdate key
and a self-signed certificate
- `privatekey.pem`: the private key
- `certificate.pem`: the self-signed certificate
```
openssl genrsa -out privatekey.pem 2048
openssl req -new -sha256 -key privatekey.pem -out node-csr.pem
openssl x509 -req -in node-csr.pem -signkey privatekey.pem -out certificate.pem
```
Note: You need to answer the questions and enter the Common Name when prompted.

### Install the Dependencies
In order to correctly load Tensorflow JavaScript npm package:
`@tensorflow/tfjs-node`, make sure there is no other `@tensorflow/tfjs-node`
package that could be searched by Node.js require() under `node_modules`
directories in current directory and all its parent directories.

Then run the `npm install` to install all dependencies in current directory.

### Launch Node-RED
Now you can use `npm run start` to launch the object detection flow and
access the Node-RED editor in `https://localhost:1880`. Since the website
uses the self-signed certificate you generated earlier, you may need to accept
some warning messages in the browser in order to view the page.

### Walk Through the Details
In the example flow, an image is processed by COCO SSD model and annotated
with the detected objects.

There are three points that you can trigger the flow:
- `Select an image file`: choose an image from your system
- `Inject`: inject an fixed image from internet
- `Camera`: use the camera from browser

Then the image is fed into the `pre-processing` node. However, for
`Select an image file` and `Inject` nodes, they need an extra node to load
the image binary from the URL or file system location.

`pre-processing` node performs the data pre-processing and compose
a tensor named map for the next node. When you launch the Node-RED, you can
see a log message in the console, similar to this:
```
[info] [tf-model:COCO SSD lite] input(s) for the model: ["image_tensor"]
```
It tells you the model's input node list only contain one tensor. Therefore,
the named map object for the model would be:
```
{
    "image_tensor": tf.Tensor
}
```
Here is the code inside the `pre-processing` node to prepare the named map
object:
```javascript
const image = tf.tidy(() => {
  return tf.node.decodeImage(msg.payload, 3).expandDims(0);
});

return {payload: { image_tensor: image } };
```
It is a `tf-function` node; you can use Tensorflow.js APIs with the `tf`
namespace. Here, it uses `tf.node.decodeImage()` to decode the image as
a 3D tensor and call `expandDims()` to prepend the batch dimension.
The code is surrended by `tf.tidy()` to clean up intermittent tensors.
Then the tensor is assigned as `image_tensor` property in the named map
object. This named map then can be used for the `COCO SSD lite` node.
For details of Tensorflow.js API, please check the website
[here](https://js.tensorflow.org/api/latest/).

In `COCO SSD lite` node, it performs the model inference and returns the
prediction results, including detected objects and bounding boxes. The
results are not easy to digest without post processing. So we pass the
results directly to `post-processing` node.

Inside `post-processing` node, it calculates the bounding boxes and detected
objects by using the `IoU` and `Min Score` settings. The output would be a
list of the following object:s
```
{
    "bbox": [x, y, w, h],
    "className": "class label",
    "score": "score"
}
```
You can use `Min Score` to filter out objects with low scores or lower the
score to get more detected objects if possible.

Before we annotate the image with detected objects, `bounding-box` node
needs two inputs:
- original image
- detected objects with bounding box information

We use a `function` node here to merge these two data into another
named map object:
```
{
    "image": <Original Image Buffer>,
    "objects": <list of detected object>
}
```
This function node executes a special logic to queue up the original image and
wait for the inference results which also contains a `complete` flag. Image
data and prediction results are paired up as a named map object and passed to
the `bounding-box` node. Finally, the `bounding box` node draws the detected
objects onto the image.