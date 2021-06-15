<template>
  <div class="graph">
    <div class="eleContainer">
      <img @dragstart="addEleDragStart($event,'image','https://dummyimage.com/50x50/d620d6/fff.png')"
           @dragend="addEleDragEnd"
           src="https://dummyimage.com/50x50/d620d6/fff.png">
      <img @dragstart="addEleDragStart($event,'image','https://dummyimage.com/50x50/4edffc/fff.png')"
        @dragend="addEleDragEnd"
        src="https://dummyimage.com/50x50/4edffc/fff.png">
      <img @dragstart="addEleDragStart($event,'image','https://dummyimage.com/50x50/4af534/fff.png')"
        @dragend="addEleDragEnd"
        src="https://dummyimage.com/50x50/4af534/fff.png">
      <div draggable="true" @dragstart="addEleDragStart($event,'text','123textNode')"  @dragend="addEleDragEnd" class="textNode">123textNode</div>
      <img @dragstart="addEleDragStart($event,'icon','https://dummyimage.com/10x10/eaff00/fff.png')"
           @dragend="addEleDragEnd"
           src="https://dummyimage.com/10x10/eaff00/fff.png">
      <div draggable="true" @dragstart="addEleDragStart($event,'tip','123tip')"  @dragend="addEleDragEnd" class="tip">123tip</div>
      <img @dragstart="addEleDragStart($event,'dagre','diamond')"
           @dragend="addEleDragEnd"
           src="../assets/diamond.png">
      <div @click="delEle">删除</div>
      <div style="margin-left: 20px;">按住shift框选</div>
    </div>
    <div id="cy" @dragenter="addEleDragEnter" @dragover="addEleDragOver"  @drop="addEleDrop"></div>
  </div>
</template>

<script>
import cytoscape from 'cytoscape'
import edgehandles from 'cytoscape-edgehandles'
import $ from 'jquery'
import konva  from 'konva'
import edgeEditing  from 'cytoscape-edge-editing'
import undoRedo  from 'cytoscape-undo-redo'
import contextMenus  from 'cytoscape-context-menus'
import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop'
import gridGuide  from 'cytoscape-grid-guide'
import 'cytoscape-context-menus/cytoscape-context-menus.css'
import { onBeforeUnmount, onMounted,ref } from 'vue'

cytoscape.use( edgehandles )
cytoscape.use(edgeEditing,$,konva)
cytoscape.use(undoRedo)
cytoscape.use(contextMenus)
cytoscape.use(gridGuide)
cytoscape.use( compoundDragAndDrop )

export default {
  name: 'graph',
  props: {
  },
  setup(props) {
    // static var
    let cy, eh,ee,cdnd,ne,
      ehOptions = {
      preview: true, // whether to show added edges preview before releasing selection
      hoverDelay: 150, // time spent hovering over a target node before it is considered selected
      handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
      snap: false, // when enabled, the edge can be drawn by just moving close to a target node
      snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
      snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
      noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
      disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
      handlePosition: function( node ){
        return 'middle middle'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
      },
      handleInDrawMode: false, // whether to show the handle in draw mode
      edgeType: function( sourceNode, targetNode ){
        // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
        // returning null/undefined means an edge can't be added between the two nodes
        return 'flat';
      },
      loopAllowed: function( node ){
        // for the specified node, return whether edges from itself to itself are allowed
        return true;
      },
      nodeLoopOffset: -50, // offset for edgeType: 'node' loops
      nodeParams: function( sourceNode, targetNode ){
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for intermediary node
        return {};
      },
      edgeParams: function( sourceNode, targetNode, i ){
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for edge
        // NB: i indicates edge index in case of edgeType: 'node'
        return {};
      },
      ghostEdgeParams: function(){
        // return element object to be passed to cy.add() for the ghost edge
        // (default classes are always added for you)
        return {};
      },
      show: function( sourceNode ){
        // fired when handle is shown
      },
      hide: function( sourceNode ){
        // fired when the handle is hidden
      },
      start: function( sourceNode ){
        // fired when edgehandles interaction starts (drag on handle)
      },
      complete: function( sourceNode, targetNode, addedEles ){
        // fired when edgehandles is done and elements are added
      },
      stop: function( sourceNode ){
        // fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
      },
      cancel: function( sourceNode, cancelledTargets ){
        // fired when edgehandles are cancelled (incomplete gesture)
      },
      hoverover: function( sourceNode, targetNode ){
        // fired when a target is hovered
      },
      hoverout: function( sourceNode, targetNode ){
        // fired when a target isn't hovered anymore
      },
      previewon: function( sourceNode, targetNode, previewEles ){
        // fired when preview is shown
      },
      previewoff: function( sourceNode, targetNode, previewEles ){
        // fired when preview is hidden
      },
      drawon: function(){
        // fired when draw mode enabled
      },
      drawoff: function(){
        // fired when draw mode disabled
      }
    },
      eeOptions = {
        // this function specifies the positions of bend points
        // strictly name the property 'bendPointPositions' for the edge to be detected for bend point edititng
        bendPositionsFunction: function(ele) {
          return ele.data('bendPointPositions');
        },
        // this function specifies the poitions of control points
        // strictly name the property 'controlPointPositions' for the edge to be detected for control point edititng
        controlPositionsFunction: function(ele) {
          return ele.data('controlPointPositions');
        },
        // whether to initilize bend and control points on creation of this extension automatically
        initAnchorsAutomatically: true,
        // the classes of those edges that should be ignored
        ignoredClasses: [],
        // whether the bend editing operations are undoable (requires cytoscape-undo-redo.js)
        undoable: true,
        // the size of bend and control point shape is obtained by multipling width of edge with this parameter
        anchorShapeSizeFactor: 3,
        // z-index value of the canvas in which bend points are drawn
        zIndex: 999,
        // whether to start the plugin in the enabled state
        enabled: true,
        /*An option that controls the distance (in pixels) within which a bend point is considered near the line segment between
          its two neighbors and will be automatically removed
          min value = 0 , max value = 20 , values less than 0 are set to 0 and values greater than 20 are set to 20
        */
        bendRemovalSensitivity : 16,
        // title of add bend point menu item (User may need to adjust width of menu items according to length of this option)
        addBendMenuItemTitle: "Add Bend Point",
        // title of remove bend point menu item (User may need to adjust width of menu items according to length of this option)
        removeBendMenuItemTitle: "Remove Bend Point",
        // title of remove all bend points menu item
        removeAllBendMenuItemTitle: "Remove All Bend Points",
        // title of add control point menu item (User may need to adjust width of menu items according to length of this option)
        addControlMenuItemTitle: "Add Control Point",
        // title of remove control point menu item (User may need to adjust width of menu items according to length of this option)
        removeControlMenuItemTitle: "Remove Control Point",
        // title of remove all control points menu item
        removeAllControlMenuItemTitle: "Remove All Control Points",
        // whether 'Remove all bend points' and 'Remove all control points' options should be presented to the user
        enableMultipleAnchorRemovalOption: true,
        // whether the bend and control points can be moved by arrows
        moveSelectedAnchorsOnKeyEvents: function () {
          return true;
        },
        // this function handles reconnection of the edge, if undefined simply connect edge to its new source/target
        // handleReconnectEdge (newSource.id(), newTarget.id(), edge.data())
        handleReconnectEdge: undefined,
        // this function checks validation of the edge and its new source/target
        validateEdge: function (edge, newSource, newTarget) {
          return 'valid';
        },
        // this function is called if reconnected edge is not valid according to validateEdge function
        actOnUnsuccessfulReconnection: undefined,
      }
      // reactive var
    let dragFrom = ref('')
   // drag handles
    const addEleDragStart = (e,type,data) => {
        dragFrom.value = type
      e.dataTransfer.setData('text/plain',JSON.stringify({type:type,data:data}))
      },
      addEleDragEnter = (e) => {
      },
      addEleDragOver = (e) => {
      const AllowedType = ['image','text','icon','tip','dagre']
      if(AllowedType.includes(dragFrom.value)){
        e.preventDefault()
        e.dataTransfer.dropEffect='move'
      }
      },
      addEleDrop = (e) => {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"))
        function addIcon(e){
          let iconTarget = cy.$('#'+e.target.id())
            let sourceImage = iconTarget.data('imgurl')
            iconTarget.data('imgurl',[sourceImage,data.data])
            iconTarget.classes(['imgNodeWithIcon'])

        }
        function addTip(e){
          console.log(e.target.id())
          let tipTarget = cy.$('#'+e.target.id())
            tipTarget.data('tip',data.data)
            !tipTarget.hasClass('nodeWithTip')&&tipTarget.addClass('nodeWithTip')
        }

      e.preventDefault()

        switch (data.type) {
          case 'image':
            cy.add({
              group: 'nodes',
              data: { width: 50,height: 50 ,imgurl:data.data,type:'imgNode'},
              classes: 'imgNode',
              renderedPosition: {x:e.offsetX,y:e.offsetY}
            })
            break;
          case 'text':
            cy.add({
              group: 'nodes',
              data: { width: 80,height: 20 ,text: data.data,type:'textNode'},
              classes: 'textNode',
              renderedPosition: {x:e.offsetX,y:e.offsetY}
            })
            break;
          case 'icon':
            // catch icon target
            cy.one('mouseover',(e)=>{
              setTimeout(()=>{
                cy.removeListener('mouseover',addIcon)
              },0)
            })
            cy.one('mouseover','node[type = "imgNode"]',addIcon)
            break;
          case 'tip':
            // catch tip target
            cy.one('mouseover',(e)=>{
              setTimeout(()=>{
                cy.removeListener('mouseover',addTip)
              },0)
            })
            cy.one('mouseover','node[type = "imgNode"]',addTip)
            break;
          case 'dagre':
            cy.add({
              group: 'nodes',
              data: { width: 60,height: 60 ,dagreType:data.data,type:'dagreNode'},
              classes: 'dagreNode',
              renderedPosition: {x:e.offsetX,y:e.offsetY}
            })
            break;
          default:
            break;
        }

      },
      addEleDragEnd = (e) => {
        dragFrom.value = ''
      },

    delEle = () => {
      cy.remove('*:selected')
    }

    onMounted(()=>{
      cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [ // list of graph elements to start with
          {
            data: { id: 'a' }
          },
          {
            data: { id: 'b' }
          }
        ],
        style: [ // the stylesheet for the graph
          {
            selector: 'node',
            style: {
              // 'background-color': '#666',
              // 'label': 'data(id)',
              'height': 20,
              'width': 20
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 1,
              'border-color': '#000'
            }
          },
          {
            selector:'node.imgNode',
            style: {
              'shape':'rectangle',
              'background-image': 'data(imgurl)',
              'background-clip': 'none',
              'background-fit': 'contain',
              'background-width': 'auto',
              'background-height': 'auto',
              // 'label': 'data(id)',
              'height': 'data(height)',
              'width': 'data(width)'
            }
          },
          {
            selector:'node.imgNodeWithIcon',
            style: {
              'shape':'rectangle',
              'background-image': 'data(imgurl)',
              'background-clip': ['none', 'none'],
              'background-fit': ['contain', 'none'],
              'background-width': ['auto', '10px'],
              'background-height': ['auto', '10px'],
              'background-position-x': ['0%', '100%'],
              'background-position-y': ['0%', '0%'],
              'background-offset-x': ['0px', '10px'],
              'background-offset-y': ['0px', '-10px'],
              'bounds-expansion': 10,
              // 'label': 'data(id)',
              'height': 'data(height)',
              'width': 'data(width)'
            }
          },
          {
            selector:'node.textNode',
            style: {
              'shape':'rectangle',
              'border-width': 1,
              'border-style': 'solid',
              'border-color': '#aaa',
              'background-color': '#fff',
              'text-wrap': 'wrap',
              'text-halign': 'center',
              'text-valign': 'center',
              'label': 'data(text)',
              'font-size': '12',
              'height': 'data(height)',
              'width': 'data(width)'
            }
          },
          {
            selector:'node.nodeWithTip',
            style: {
              'text-halign': 'center',
              'text-valign': 'bottom',
              'label': 'data(tip)',
              'font-size': '10',
              'text-margin-y': '10'
            }
          },
          {
            selector:'node.dagreNode',
            style: {
              'shape':'data(dagreType)',
              // 'label': 'data(id)',
              'height': 'data(height)',
              'width': 'data(width)'
            }
          },
          {
            selector: 'edge',
            style: {
              // 'width': 2,
              // 'line-color': '#ccc',
              // 'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier'
              // "curve-style": "taxi"
            }
          },
          {
            selector: '.eh-handle',
            style: {
              'background-color': 'red',
              'width': 6,
              'height': 6,
              'shape': 'ellipse',
              'overlay-opacity': 0,
            }
          },
          {
            selector: '.eh-hover',
            style: {
              'background-color': 'red'
            }
          },
          {
            selector: '.eh-source',
            style: {
              'border-width': 2,
              'border-color': 'red'
            }
          },
          {
            selector: '.eh-target',
            style: {
              'border-width': 2,
              'border-color': 'red'
            }
          },
          {
            selector: '.eh-preview, .eh-ghost-edge',
            style: {
              'background-color': 'red',
              'line-color': 'red',
              'target-arrow-color': 'red',
              'source-arrow-color': 'red'
            }
          },
          {
            selector: '.eh-ghost-edge.eh-preview-active',
            style: {
              'opacity': 0
            }
          }
        ],
        layout: {
          name: 'random'
        }
      })
      eh = cy.edgehandles( ehOptions )
      ee = cy.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true
      })
      cdnd = cy.compoundDragAndDrop()
      cy.gridGuide({
        guidelinesStyle: {
          strokeStyle: "black",
          horizontalDistColor: "#ff0000",
          verticalDistColor: "green",
          initPosAlignmentColor: "#0000ff",
        }
      })
      cy.style().update()
      cy.boxSelectionEnabled(true)
      // cy.style()
      //   .selector('edge')
      //   .style({
      //     'curve-style': 'bezier'
      //   })
      //   .update()

      // test code
      cy.on('tap', '*', function(evt){
        var node = evt.target;
        console.log(  node.classes() );
        console.log(  node.data() );
      });

      document.addEventListener('keydown', function (e){
        if (e.ctrlKey && e.which == '90') {
          cy.undoRedo().undo();
        }
        else if (e.ctrlKey && e.which == '89') {
          cy.undoRedo().redo();
        }
      }, true );
      // eh.enableDrawMode()
    })

    onBeforeUnmount(()=>{
      cy.destroy()
    })

    return {
      addEleDragStart,
      addEleDragEnter,
      addEleDragOver,
      addEleDrop,
      addEleDragEnd,
      delEle
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.graph{
  display: flex;
  height: 100%;
  width: 100%;
}
.eleContainer{
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: flex-start;
  box-sizing: border-box;
  border: 1px solid #aaa;
  z-index: 1;
  background: #ccc;
  img{
    margin-left: 20px;
  }
  .textNode{
    border: 1px solid #222;
    cursor: default;
    margin-left: 20px;
  }
  .tip{
    background-color: #fff;
    cursor: default;
    margin-left: 20px;
  }
}

#cy{
  flex: 4;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid #aaa;
  z-index: 1;
}
</style>
