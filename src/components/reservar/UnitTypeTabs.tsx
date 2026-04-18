"use client";

export type UnitTypeTabItem = {
  id: string;
  name: string;
  availableCount: number;
  totalCount: number;
};

type UnitTypeTabsProps = {
  items: UnitTypeTabItem[];
  selectedId: string;
  onSelect: (typeId: string) => void;
  disabled?: boolean;
};

export default function UnitTypeTabs({
  items,
  selectedId,
  onSelect,
  disabled = false,
}: UnitTypeTabsProps) {
  if (items.length === 0) return null;

  return (
    <div className="unit-type-tabs" role="tablist" aria-label="Tipo de alojamiento">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            className={`unit-type-tabs__tab${selected ? " unit-type-tabs__tab--selected" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="unit-type-tabs__name">{item.name}</span>
            <span className="unit-type-tabs__meta">
              {item.availableCount} disponible{item.availableCount === 1 ? "" : "s"}
              <span className="unit-type-tabs__total"> · {item.totalCount} en total</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
