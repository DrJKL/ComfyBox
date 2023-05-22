import { parseWhateverIntoImageMetadata, type ComfyBoxImageMetadata, type ComfyUploadImageType } from "$lib/utils";
import { BuiltInSlotType, LiteGraph, type IComboWidget, type ITextWidget, type PropertyLayout, type SlotLayout, type INumberWidget } from "@litegraph-ts/core";
import { get, writable, type Writable } from "svelte/store";

import GalleryWidget from "$lib/widgets/GalleryWidget.svelte";
import type { ComfyWidgetProperties } from "./ComfyWidgetNode";
import ComfyWidgetNode from "./ComfyWidgetNode";

export interface ComfyGalleryProperties extends ComfyWidgetProperties {
    index: number | null,
    updateMode: "replace" | "append",
}

export default class ComfyGalleryNode extends ComfyWidgetNode<ComfyBoxImageMetadata[]> {
    override properties: ComfyGalleryProperties = {
        tags: [],
        defaultValue: [],
        index: 0,
        updateMode: "replace",
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "images", type: "OUTPUT" },
            { name: "store", type: BuiltInSlotType.ACTION, options: { color_off: "rebeccapurple", color_on: "rebeccapurple" } }
        ],
        outputs: [
            { name: "images", type: "COMFYBOX_IMAGES" },
            { name: "selected_index", type: "number" },
        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "updateMode", defaultValue: "replace", type: "enum", options: { values: ["replace", "append"] } }
    ]

    override svelteComponentType = GalleryWidget
    override defaultValue = []
    override saveUserState = false;
    override outputSlotName = null;
    override changedEventName = null;

    selectedFilename: string | null = null;

    selectedIndexWidget: INumberWidget;
    modeWidget: IComboWidget;

    imageWidth: Writable<number> = writable(0);
    imageHeight: Writable<number> = writable(0);

    selectedImage: Writable<number | null> = writable(null);

    constructor(name?: string) {
        super(name, [])
        this.selectedIndexWidget = this.addWidget("number", "Selected", get(this.selectedImage))
        this.selectedIndexWidget.disabled = true;
        this.modeWidget = this.addWidget("combo", "Mode", this.properties.updateMode, null, { property: "updateMode", values: ["replace", "append"] })
    }

    override onPropertyChanged(property: any, value: any) {
        if (property === "updateMode") {
            this.modeWidget.value = value;
        }
    }

    override onExecute() {
        const value = get(this.value)
        const index = get(this.selectedImage)
        this.setOutputData(0, value)
        this.setOutputData(1, index)

        this.selectedIndexWidget.value = index;

        if (index != null && value && value[index] != null) {
            const image = value[index];
            image.width = get(this.imageWidth)
            image.height = get(this.imageHeight)
        }
    }

    override onAction(action: any, param: any, options: { action_call?: string }) {
        super.onAction(action, param, options)
    }

    override formatValue(value: ComfyBoxImageMetadata[] | null): string {
        return `Images: ${value?.length || 0}`
    }

    override parseValue(param: any): ComfyBoxImageMetadata[] {
        if (param == null)
            return []

        const meta = parseWhateverIntoImageMetadata(param) || [];

        console.debug("[ComfyGalleryNode] Received output!", param)

        if (this.properties.updateMode === "append") {
            const currentValue = get(this.value)
            if (meta.length > 0)
                this.selectedImage.set(currentValue.length);
            return currentValue.concat(meta)
        }
        else {
            this.notifyPropsChanged();
            return meta;
        }
    }

    override setValue(value: any, noChangedEvent: boolean = false) {
        super.setValue(value, noChangedEvent)
    }
}

LiteGraph.registerNodeType({
    class: ComfyGalleryNode,
    title: "UI.Gallery",
    desc: "Gallery that shows most recent outputs",
    type: "ui/gallery"
})
