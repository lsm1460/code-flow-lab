import { TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';
import ViewerElBlock from '..';

interface Props {
  elRef: RefObject<HTMLButtonElement>;
  viewerItem: ViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  mapItem;
}
function ViewerButtonBlock({ elRef, viewerItem, triggerProps, addedStyle, mapItem }: Props) {
  return (
    <button ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} mapItem={mapItem} />
      ))}
    </button>
  );
}

export default ViewerButtonBlock;
