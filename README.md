# Camio Stream Web Component

## Installation
### In Angular:
1. Add `schemas: [CUSTOM_ELEMENTS_SCHEMA]` into `app.module.ts` of the app you want to import into.
2. In `main.ts` add an import statement. It would be the same as embedding a script from an external source. For example, if I wanted something like `<script type='text/javascript' src="Desktop/custom-component.js"></script>`, then I would write this import into the main.ts: `import "Desktop/custom-component.js"`. It is still unclear to me if this can fetch from an external source like a script could (will figure out).
3. Using the tag name that you declared for the custom component, just embed it where you want it in the app as if it was a regular component. Eg. in this case: `<camio-stream-component></camio-stream-component>`

### In Javascript and HTML:
1. Place the web component declaration in the body of the html file (including inputs you need).
2. Underneath that, place a script tag that imports the `custom-component.js` file and declares it as type `text/javascript`.
3. Finally, add another script tag and inside that, place all event listeners.

```
...
<body>
  <camio-stream-component thisInput="ourVariable"></camio-stream-component>
  
  <script type="text/javascript" src="path/to/camio-stream-component.js"></script>
  <script>
    // Javascript code for registering event listeners (see Javascript: Outputs below)
  </script>
</body>
```


## The Life-Cycle of Web Components:
- `connectedCallback`: Invoked each time the custom element is appended into a document-connected element. This will happen each time the node is moved, and may happen before the element's contents have been fully parsed.
**Note: connectedCallback may be called once your element is no longer connected, use Node.isConnected to make sure.**
- `disconnectedCallback`: Invoked each time the custom element is disconnected from the document's DOM.
- `adoptedCallback`: Invoked each time the custom element is moved to a new document.
- `attributeChangedCallback`: Invoked each time one of the custom element's attributes is added, removed, or changed. Which attributes to notice change for is specified in a static get observedAttributes method

source: [Mozilla](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)


## Handling Input/Output events
### In Angular:
#### Inputs:
Follow the normal Angular syntax for inputs. That is `<camio-stream-component [inputTitle]="componentNeedsThis"></camio-stream-component>` would take our local variable `componentNeedsThis` and gives it to the web component as an input variable called `inputTitle`. **Note: inputTitle has to be the name of an actual input in the web component**

#### Outputs:
Follow the normal Angular syntax unless you need the payload of an event. That is `<camio-stream-component (outputTitle)="functionToCall()"></camio-stream-component>` would call our local function called `functionToCall` whenever an event fires from the emitter variable called `outputTitle`. Unlike typical Angular Syntax though, `$event` encapsulates the full event instead of the actual payload. To get the payload, and pass it to our function, we would have to do this: `(outputTitle)="functionToCall($event.detail)`. **Note: outputTitle has to be the name of an actual output event in the web component**

### In Javascript:
#### Inputs:
`<camio-stream-component inputTitle="componentNeedsThis"></camio-stream-component>` would take our local variable `componentNeedsThis` and gives it to the web component as an input variable called `inputTitle`.

Some sample code to make this more clear:
```
<camio-stream-component inputTitle="componentNeedsThis"></camio-stream-component>
<script>
var componentNeedsThis = "important words"
</script>
```

#### Outputs:
Unlike inputs, the outputs don't need to be declared in the html, instead they should be handled in a seperate script within the `connectedCallback()` function (so that we can actually catch the events) by registering an event listener (on the shadow dom I think?).

**Note: This needs to be tested, syntax may be slightly off.**
Some sample code to make this more clear:
```
<camio-stream-component></camio-stream-component>
<script>
connectedCallback(){
  ...
  this.shadowRoot.addEventListener("outputTitle", function (event) {
    ...
    // Do stuff with event that will happen when outputTitle fires
    ...
    });
}
</script>
```

## Schema for this web component (WIP):
### Inputs
- *stream*
  - Payload: LiveStream
  - Description: The livestream and it's metadata which will be used to embed the component.

- *streamDim*
  - Payload: VideoDimensions
  - Description: Used to dynamically adjust the video's dimensions so it should work on mobile screens.

- *posterUrl*
  - Payload: string or null
  - Description: Used to determine if the stream should be displaying a poster image, or if the stream should be live. To make the stream show, set this to null and make sure the component is recieving a .m3u8 manifest file in the stream input.

### Outputs
- *focusVideo*
  - Payload: none
  - Triggered: Any time the user clicks on the stream component
  - Description: When the user clicks on the stream, you may want to focus on that screen somehow.

- *showBorder*
  - Payload: boolean
  - Triggered: On mouseover, dispatch true, on mouseleave, dispatch false
  - Description: When the user hovers over the stream, an event is dispached with a 'true' payload, and when the user unhovers over the screen, the event has a 'false' payload