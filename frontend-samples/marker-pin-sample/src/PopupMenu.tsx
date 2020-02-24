/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { GlobalContextMenu, ContextMenuItem, UiEvent } from "@bentley/ui-core";

export interface PopupMenuEntry {
  label: string;
  onPicked: (entry: PopupMenuEntry) => void;
}

export interface PopupMenuState {
  menuVisible: boolean;
  menuX: number;
  menuY: number;
  entries?: PopupMenuEntry[];
}

/** Event used to change the state of the PopupMenu component */
export class PopupMenuEvent extends UiEvent<PopupMenuState> { }

/** A React component that renders the UI for a simple popup menu */
export class PopupMenu extends React.Component<{}, PopupMenuState> {

  /** @hidden */
  public readonly state: PopupMenuState = {
    menuVisible: false,
    menuX: 0,
    menuY: 0,
  };

  public static readonly onPopupMenuEvent = new PopupMenuEvent();

  // This instance of Popup menu will listen for the event
  public componentDidMount() {
    PopupMenu.onPopupMenuEvent.addListener(this._handlePopupMenuEvent);
  }

  // Stop listenting when this instance of the Popup menu is done
  public componentWillUnmount() {
    PopupMenu.onPopupMenuEvent.removeListener(this._handlePopupMenuEvent);
  }

  // When the event is triggered, change the state of the component
  private _handlePopupMenuEvent = (state: PopupMenuState) => {
    this.setState(state);
  }

  /** The popup menu's render method */
  public render(): React.ReactNode {
    const { entries, menuX, menuY, menuVisible } = this.state;
    const onClose = this._hideContextMenu;

    if (menuVisible) {
      const items = this.getMenuItems(entries);

      return (
        <GlobalContextMenu
          identifier="popup-menu"
          x={menuX}
          y={menuY}
          opened={menuVisible}
          onEsc={onClose}
          onOutsideClick={onClose}
          edgeLimit={false}
          autoflip={true}
        >
          {items}
        </GlobalContextMenu>
      );
    }

    return null;
  }

  // Create an array of menu items as specified by the entries
  private getMenuItems(entries?: PopupMenuEntry[]): React.ReactNode[] {
    const items: React.ReactNode[] = [];

    if (entries) {
      entries.forEach((link: any, index: number) => {
        const item = this.getMenuItem(link, index);
        if (item)
          items.push(item);
      });
    }

    return items;
  }

  // Create a menu item for a single entry
  private getMenuItem(entry: PopupMenuEntry, index: number): React.ReactNode {

    const sel = () => this._itemPicked(entry);
    const node = (
      <ContextMenuItem key={index}
        onSelect={sel} >
        {entry.label}
      </ContextMenuItem>
    );

    return node;
  }

  private _hideContextMenu = () => {
    this.setState({ menuVisible: false, entries: undefined });
  }

  private _itemPicked = (entry: PopupMenuEntry): void => {
    this._hideContextMenu();
    entry.onPicked(entry);
  }
}
