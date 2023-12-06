import { TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';
import ViewerElBlock from '..';

interface Props {
  elRef: RefObject<HTMLButtonElement>;
  viewerItem: ViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  mapItem;
  isOnlyViewer: boolean;
}
function ViewerButtonBlock({ elRef, viewerItem, triggerProps, addedStyle, mapItem, isOnlyViewer }: Props) {
  return (
    <button ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} mapItem={mapItem} isOnlyViewer={isOnlyViewer} />
      ))}
    </button>
  );
}

export default ViewerButtonBlock;
