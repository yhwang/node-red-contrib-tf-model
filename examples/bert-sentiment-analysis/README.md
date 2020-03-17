## Object Detection Example Flow
This example flow uses a BERT Sentiment model to classify comments sentiment of a Youtube video
and charts the result.

### Install the Dependencies
In order to correctly load Tensorflow JavaScript npm package:
`@tensorflow/tfjs-node`, make sure there is no other `@tensorflow/tfjs-node`
package that could be searched by Node.js require() under `node_modules`
directories in current directory and all its parent directories.

Then run the `npm install` to install all dependencies in current directory.

### Launch Node-RED
Now you can use `npm run start` to launch the object detection flow and
access the Node-RED editor in `https://localhost:1880`.

### Walk Through the Details
In the main flow, comments are processed by the sentiment analysis subflow to
be classified as positive or negative. The classification is then shown in a chart.

You may use inject to trigger the flow. In the inject and under payload, select
JSON to modify the object that contains:
- video_id: the unique id can be found in a video uri prefixed with `v=`.
- max_comments: only pull the number of latest comments.

Example object:
`{"video_id":"9bZkp7q19f0", "max_comments":"100"}`

The comments are pulled down by the `Read Comments` function node and
then fed into the `Sentiment Analysis` subflow which basically, sanitize
comments, tokenize, and classify comment sentiment.

The result is charted by the `chart` subflow and graph can be accessed
from the dashboard tab in the sidebar.

The comments and classification score can be seem from the debug
tab in the sidebar as well.

