import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Subject } from "rxjs";
import Hls from "hls.js";
import { LiveStream, VideoDimensions } from "./app.models";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class AppComponent implements OnInit, OnChanges {
  /** Represents the stream object with all it's metadata. */
  @Input() stream: LiveStream;

  /** Constantly updated with the dimension of the stream video based on window size. */
  @Input() streamDim: VideoDimensions;

  /** The image to display instead of the livestream. (if this is null, display stream) */
  @Input() posterUrl: string;

  /** When the user clicks on the video. */
  @Output() focusVideo: EventEmitter<void> = new EventEmitter<void>();

  /** When the user hovers over the video. */
  @Output() showBorder: EventEmitter<boolean> = new EventEmitter<boolean>();

  /** When the video errors either because too many retries or link not working. */
  @Output() hasErrored: EventEmitter<void> = new EventEmitter<void>();

  /** The video tag so we don't have to worry about shadow doms and encapsulation */
  @ViewChild("stream", { static: false }) videoElement: ElementRef;

  constructor(public cdr: ChangeDetectorRef) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.

    // In the future, we may have to decide if this is the desired behavior
    if (
      !!changes["stream"] &&
      this.posterUrl == null &&
      changes["stream"].firstChange
    ) {
      this.setupHls(this.stream);
    }
    if (
      !!changes["stream"] &&
      this.posterUrl == null &&
      !!changes["stream"].previousValue &&
      changes["stream"].currentValue["manifestUrl"] !==
        changes["stream"].previousValue["manifestUrl"]
    ) {
      this.setupHls(this.stream);
    }
    if (!!changes["posterUrl"] && !changes["posterUrl"].currentValue) {
      this.setupHls(this.stream);
    }
  }

  /** Setup the HLS stream */
  setupHls(stream: LiveStream) {
    let retryCount = 3;
    // Retry Interval every 100ms
    let exists = setInterval(() => {
      let camioStream = this.videoElement.nativeElement;
      if (stream && retryCount != 0 && camioStream) {
        clearInterval(exists);
        if (Hls.isSupported()) {
          let hls = new Hls();
          let retries = { network: 0, media: 0 };
          hls.on(Hls.Events.ERROR, (event, data) => {
            // Note: I grabbed this straight from the docs for hls.js
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR && retries.network < 2:
                  // try to recover network error
                  hls.startLoad();
                  retries.network++;
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR && retries.media < 2:
                  hls.recoverMediaError();
                  retries.media++;
                  break;
                default:
                  // cannot recover
                  hls.destroy();
                  this.hasErrored.emit()
                  break;
              }
            }
          });

          hls.attachMedia(camioStream);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            camioStream.muted = true;
            camioStream.controls = true;
            camioStream.loop = true;
            hls.loadSource(stream.manifestUrl);
            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
              //console.log(data)
            });
          });
        } else if (camioStream.canPlayType("application/vnd.apple.mpegurl")) {
          camioStream.src = stream.manifestUrl;
        }
      } else if (retryCount == 0) {
        clearInterval(exists);
        this.hasErrored.emit();
      } else {
        retryCount--;
      }
    }, 100);
  }
}
