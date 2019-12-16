import { homedir } from 'os';
import * as path from 'path';
import { mkdirSync } from 'fs';
import * as tf from '@tensorflow/tfjs-node';

const CACHE_DIR = path.join(homedir(), '.node-red', 'tf-model');

// make sure the CACHE_DIR exists
mkdirSync(CACHE_DIR, {recursive: true});

/**
 * Represent Node-Red's runtime
 */
declare class NodeRed {
  nodes: NodeRedNodes;
}

declare class NodeRedWire {
  [index: number]: string;
}

declare class NodeRedWires {
  [index: number]: NodeRedWire;
}

/**
 * Represent Node-Red's configuration for a custom node
 * For this case, it's the configuration for tf-model node
 */
declare class NodeRedProperties {
  id: string;
  type: string;
  name: string;
  modelURL: string;
  wires: NodeRedWires;
}

/**
 * Represent Node-Red's nodes
 */
declare class NodeRedNodes {
  // tslint:disable-next-line:no-any
  createNode(node: any, props: NodeRedProperties): void;
  // tslint:disable-next-line:no-any
  registerType(type: string, ctor: any): void;
}

/**
 * Represent Node-Red's message that passes to a node
 */
declare class NodeRedMessage {
  payload: Buffer|string;
}

declare interface StatusOption {
  fill: 'red' | 'green' | 'yellow' | 'blue' | 'grey';
  shape: 'ring' | 'dot';
  text: string;
}

// Module for a Node-Red custom node
export = function tfModel(RED: NodeRed) {

  class TFModel {
    // tslint:disable-next-line:no-any
    on: (event: string, fn: (msg: any) => void) => void;
    send: (msg: NodeRedMessage) => void;
    status: (option: StatusOption) => void;
    log: (msg: string) => void;

    id: string;
    type: string;
    name: string;
    wires: NodeRedWires;
    modelURL: string;
    model: tf.GraphModel;

    constructor(config: NodeRedProperties) {
      this.id = config.id;
      this.type = config.type;
      this.name = config.name;
      this.wires = config.wires;
      this.modelURL = config.modelURL;

      RED.nodes.createNode(this, config);
      this.on('input', (msg: NodeRedMessage) => {
        this.handleRequest(msg);
      });

      this.on('close', (done: () => void) => {
        this.handleClose(done);
      });

      if (this.modelURL.trim().length > 0) {
        this.status({fill:'red' ,shape:'ring', text:'loading model...'});
        this.log(`loading model from: ${this.modelURL}`);
        tf.loadGraphModel(this.modelURL).then((model: tf.GraphModel) => {
          this.model = model;
          this.status({fill:'green' ,shape:'dot', text:'model is ready'});
          this.log(`model loaded`);
        });
      }
    }

    // handle a single request
    handleRequest(msg: NodeRedMessage) {

    }

    handleClose(done: () => void) {
      // node level clean up
      if (this.model) {
        this.model.dispose();
      }
      done();
    }

  }

  RED.nodes.registerType('tf-model', TFModel);
};
