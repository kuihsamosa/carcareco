import React, { useState, useImperativeHandle, useRef, useCallback } from "react";
import { EditableCellHandle, IEditableBaseCellProps } from "./EditableCell";
import TypeAheadCombobox from "@/app/home/_components/TypeAheadCombobox";
import { dataPage } from "@/_lib/client/query-api";

interface ISaleableData {
    code: string | null,
    name: string,
    price: number | null
}

interface IEditableNameCellProps<Type extends string | null> extends IEditableBaseCellProps<Type> {
    codeRef: React.RefObject<EditableCellHandle<string> | null>,
    priceRef: React.RefObject<EditableCellHandle<number> | null>
}

const EditableNameCell = React.forwardRef<EditableCellHandle<string>, IEditableNameCellProps<string | null>>((props, ref) => {
    const {
        defaultValue, placeholder, id, name, className, isEditing, codeRef, priceRef
    } = props;

    const [internalValue, setInternalValue] = useState(defaultValue);
    const [selectedItem, setSelectedItem] = useState<ISaleableData | null>({ code: '', name: defaultValue ?? '', price: null });
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchSeq = useRef(0);

    useImperativeHandle(ref, () => ({
        getValue(): string | null {
            return internalValue;
        },
        setValue(value: string | null) {
            return setInternalValue(value);
        },
    }));

    const doSearch = useCallback((inputValue: string, target: (data: ISaleableData[]) => void, seq: number) => {
        const deliver = (items: ISaleableData[]) => {
            if (seq !== searchSeq.current) return;
            const data = [...items];
            data.unshift({ code: '', name: inputValue, price: null });
            target(data);
        };

        dataPage({
            resourceName: 'saleables',
            searchText: inputValue,
            whenReady: (items) => deliver(items as ISaleableData[]),
            onFailure: () => {
                dataPage({
                    resourceName: 'spareparts',
                    searchText: inputValue,
                    whenReady: (items) => deliver(items as ISaleableData[]),
                    onFailure: ({ url, status, text }) => {
                        console.log(url, status, text);
                    }
                });
            }
        });
    }, []);

    if (!isEditing) return internalValue;

    return (
        <TypeAheadCombobox
            id={id?.toString()}
            placeholder={placeholder}
            defaultValue={selectedItem}
            name={name}
            className={className}
            comboboxOptionsAbsolute={true}
            comboboxOptionsWidth={100}
            displayFormatter={(item) => item?.name ?? ''}
            optionFormatter={(item) => {
                return item?.name ? (item.code ? item.code + ' (' + item.name + ')' : item.name) : ''
            }}
            onItemChange={(item) => {
                setSelectedItem(item);
                if (item?.name) setInternalValue(item.name);
                if (item?.code && codeRef?.current) codeRef.current.setValue(item.code);
                if (item?.price && priceRef?.current) priceRef.current.setValue(item.price);
            }}
            onSearch={(e, target) => {
                const inputValue = e.currentTarget.value;
                if (!inputValue) return;

                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                const seq = ++searchSeq.current;

                debounceTimer.current = setTimeout(() => {
                    doSearch(inputValue, target, seq);
                }, 200);
            }}
        >
        </TypeAheadCombobox>
    )
});
EditableNameCell.displayName = "EditableNameCell";
export {
    EditableNameCell
}
