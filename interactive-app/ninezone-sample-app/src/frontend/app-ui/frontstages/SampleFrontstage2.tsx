/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { ViewState } from "@bentley/imodeljs-frontend";
import { SvgPath } from "@bentley/ui-core";
import {
  CommandItemDef, ContentGroup, ContentLayoutDef, ContentLayoutManager, ContentViewManager,
  CoreTools, CustomItemDef, Frontstage, FrontstageProvider, GroupItemDef, IModelViewportControl,
  ItemList, NavigationWidget, StagePanel, SyncUiEventId, ToolWidget, UiFramework, ViewSelector,
  Widget, WidgetState, Zone, ZoneState,
} from "@bentley/ui-framework";

import { AppUi } from "../AppUi";
import { AppStatusBarWidget } from "../statusbars/AppStatusBar";
import { PropertyGridWidget } from "../widgets/PropertyGridWidget";
import { TableWidget } from "../widgets/TableWidget";
import { TreeWidget } from "../widgets/TreeWidget";

/* eslint-disable react/jsx-key */

/**
 * Sample Frontstage for 9-Zone sample application
 */
export class SampleFrontstage2 extends FrontstageProvider {
  // TWo content layouts for content views
  private _contentLayoutDef1: ContentLayoutDef;
  private _contentLayoutDef2: ContentLayoutDef;

  // Content group for both layouts
  private _contentGroup: ContentGroup;

  constructor(public viewStates: ViewState[]) {
    super();

    // Create the content layouts.
    this._contentLayoutDef1 = new ContentLayoutDef({
      id: "SingleContent",
    });

    this._contentLayoutDef2 = new ContentLayoutDef({
      verticalSplit: { percentage: 0.50, left: 0, right: 1 },
    });

    // Create the content group.
    this._contentGroup = new ContentGroup({
      contents: [
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: this.viewStates[0],
            iModelConnection: UiFramework.getIModelConnection(),
          },
        },
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: this.viewStates[1],
            iModelConnection: UiFramework.getIModelConnection(),
          },
        },
      ],
    });
  }

  /** Define the Frontstage properties */
  public get frontstage() {

    return (
      <Frontstage id="SampleFrontstage2"
        defaultTool={CoreTools.selectElementCommand} defaultLayout={this._contentLayoutDef2} contentGroup={this._contentGroup}
        isInFooterMode={true}

        topLeft={
          <Zone
            widgets={[
              <Widget isFreeform={true} element={<SampleToolWidget switchLayout1={this._switchLayout1} switchLayout2={this._switchLayout2} />} />,
            ]}
          />
        }
        topCenter={
          <Zone
            widgets={[
              <Widget isToolSettings={true} />,
            ]}
          />
        }
        topRight={
          <Zone
            widgets={[
              /** Use custom NavigationWidget */
              <Widget isFreeform={true} element={<SampleNavigationWidget />} />,
            ]}
          />
        }
        centerRight={
          <Zone defaultState={ZoneState.Minimized} allowsMerging={true}
            widgets={[
            ]}
          />
        }
        bottomCenter={
          <Zone
            widgets={[
              <Widget isStatusBar={true} control={AppStatusBarWidget} />,
            ]}
          />
        }
        bottomRight={
          <Zone defaultState={ZoneState.Open} allowsMerging={true}
            widgets={[
            ]}
          />
        }
        bottomPanel={
          <StagePanel
            size={200}
            widgets={[
              <Widget control={TableWidget} fillZone={true}
                iconSpec="icon-table-2" labelKey="NineZoneSample:components.table"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
            ]}
          />
        }
        rightPanel={
          <StagePanel
            allowedZones={[6, 9]}
            size={260}
            widgets={[
              <Widget control={TreeWidget} fillZone={true}
                iconSpec="icon-tree" labelKey="NineZoneSample:components.tree"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
              <Widget id="Properties" control={PropertyGridWidget} defaultState={WidgetState.Closed} fillZone={true}
                iconSpec="icon-properties-list" labelKey="NineZoneSample:components.properties"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
                syncEventIds={[SyncUiEventId.SelectionSetChanged]}
                stateFunc={this._determineWidgetStateForSelectionSet}
              />,
            ]}
          />
        }
      />
    );
  }

  /** Determine the WidgetState based on the Selection Set */
  private _determineWidgetStateForSelectionSet = (): WidgetState => {
    const activeContentControl = ContentViewManager.getActiveContentControl();
    if (activeContentControl && activeContentControl.viewport && (activeContentControl.viewport.view.iModel.selectionSet.size > 0))
      return WidgetState.Open;
    return WidgetState.Closed;
  };

  /** Command that switches to layout 1 */
  private get _switchLayout1(): CommandItemDef {
    return new CommandItemDef({
      iconSpec: "icon-placeholder",
      labelKey: "NineZoneSample:buttons.switchToLayout1",
      execute: async () => {
        await ContentLayoutManager.setActiveLayout(this._contentLayoutDef1, this._contentGroup);
      },
    });
  }

  /** Command that switches to layout 2 */
  private get _switchLayout2(): CommandItemDef {
    return new CommandItemDef({
      iconSpec: "icon-placeholder",
      labelKey: "NineZoneSample:buttons.switchToLayout2",
      execute: async () => {
        await ContentLayoutManager.setActiveLayout(this._contentLayoutDef2, this._contentGroup);
      },
    });
  }
}

/* Properties for SampleToolWidget widget */
interface SampleToolWidgetProps {
  switchLayout1: CommandItemDef;
  switchLayout2: CommandItemDef;
}

/**
 * Define a ToolWidget with Buttons to display in the TopLeft zone.
 */
class SampleToolWidget extends React.Component<SampleToolWidgetProps> {

  public render(): React.ReactNode {
    const horizontalItems = new ItemList([
      CoreTools.selectElementCommand,
    ]);

    const verticalItems = new ItemList([
      new GroupItemDef({
        labelKey: "NineZoneSample:buttons.switchLayouts",
        iconSpec: "icon-placeholder",
        items: [
          this.props.switchLayout1,
          this.props.switchLayout2,
        ],
      }),
    ]);

    return (
      <ToolWidget
        appButton={AppUi.backstageToggleCommand}
        horizontalItems={horizontalItems}
        verticalItems={verticalItems}
      />
    );
  }
}

/**
 * Define a NavigationWidget with Buttons to display in the TopRight zone.
 */
class SampleNavigationWidget extends React.Component {
  /** SVG Icon to use for the Rotate tool */
  private get _rotateSvgIcon(): React.ReactNode {
    return (
      <SvgPath viewBoxWidth={91} viewBoxHeight={91} paths={[
        "M86.734,49.492c-4.305,0.01-17.991,1.527-20.508,1.943c-1.589,0.261-3.454,0.267-4.732,1.335   c-1.173,0.98-0.649,2.788,0.453,3.52c1.182,0.78,17.18,0.641,19.686,0.645c-0.216,0.404-4.764,8.202-7.226,11.423   c-4.994,6.53-12.322,11.926-20.213,14.39c-9.906,3.093-21.47,0.982-30.055-4.716c-4.252-2.82-7.595-6.813-10.364-11.047   c-2.37-3.625-4.53-8.918-8.038-11.526c-0.238-0.18-0.687-0.002-0.732,0.298c-0.548,3.663,1.414,7.707,2.843,10.992   c1.7,3.904,4.146,7.539,6.933,10.755c5.891,6.799,14.97,10.758,23.738,12.057c15.313,2.272,30.362-4.708,39.961-16.643   c2.182-2.715,4.058-5.652,5.88-8.618c-0.04,4.63-0.08,9.262-0.109,13.891c-0.026,4.004,6.195,4.008,6.222,0   c0.054-8.303,0.122-16.604,0.122-24.907C90.594,51.061,87.978,49.49,86.734,49.492z",
        "M17.98,20.688c5.096-5.933,12.107-11.209,19.818-13.11c10.523-2.591,23.726,1.216,31.448,8.788   c3.523,3.45,6.227,7.538,8.734,11.751c2.084,3.496,4.084,8.505,7.364,11.009c0.244,0.187,0.678-0.004,0.731-0.296   c0.637-3.572-1.238-7.563-2.511-10.82c-1.516-3.889-3.713-7.637-6.163-11.013C72.166,9.786,64.534,5.113,56.037,2.605   C39.996-2.125,24.416,4.048,13.693,16.4c-2.328,2.684-4.36,5.616-6.345,8.567c0.256-3.586,0.517-7.172,0.765-10.759   c0.278-3.995-5.944-3.977-6.221,0c-0.492,7.064-1.519,21.896-1.484,22.229c0.013,0.612-0.002,3.301,2.793,3.301   c3.233,0.002,10.855-0.29,14.028-0.466c2.881-0.16,5.805-0.179,8.675-0.475c1.158-0.121,3.727-0.079,3.836-1.451   c0.175-2.197-3.893-3.01-4.988-3.118c-3.061-0.304-13.198-1.281-15.208-1.447c0.288-0.488,0.571-0.964,0.853-1.389   C12.798,27.753,15.135,24.001,17.98,20.688z",
      ]} />
    );
  }

  public render() {
    const rotateToolItemDef = CoreTools.rotateViewCommand;
    rotateToolItemDef.iconSpec = this._rotateSvgIcon;

    const horizontalItems = new ItemList([
      CoreTools.fitViewCommand,
      CoreTools.windowAreaCommand,
      CoreTools.zoomViewCommand,
      CoreTools.panViewCommand,
      rotateToolItemDef,
    ]);

    const verticalItems = new ItemList([
      CoreTools.toggleCameraViewCommand,

      new CustomItemDef({
        customId: "sampleApp:viewSelector",
        reactElement: (
          <ViewSelector imodel={UiFramework.getIModelConnection()} />
        ),
      }),
    ]);

    return (
      <NavigationWidget
        horizontalItems={horizontalItems}
        verticalItems={verticalItems}
      />
    );
  }
}
