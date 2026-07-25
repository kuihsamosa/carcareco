import React, { useState, useImperativeHandle, useRef, useCallback } from "react";
import { EditableCellHandle, IEditableBaseCellProps  } from "./EditableCell";
import TypeAheadCombobox from "@/app/home/_components/TypeAheadCombobox";
import { dataPage } from "@/_lib/client/query-api";

 interface ISparePartData{
    code:string |null ,
    name:string   ,
    price:number| null
 }
interface IEditableCodeCellProps<Type extends   string | null> extends IEditableBaseCellProps<Type>
{
   nameRef: React.RefObject<EditableCellHandle<string>|null> ,
   priceRef: React.RefObject<EditableCellHandle<number>|null>
}

const EditableCodeCell = React.forwardRef<EditableCellHandle<string>,IEditableCodeCellProps<string|null>>((props, ref) => {
    const {
        defaultValue, placeholder, id, name, className, isEditing, nameRef,priceRef
    } = props;

    const [internalValue, setInternalValue] = useState(defaultValue);

    const[selectedItem,setSelectedItem]=useState<ISparePartData | null >({ code:defaultValue,name:'',price:null});
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchSeq = useRef(0);

    useImperativeHandle(ref, () => ({
        getValue(): string | null{
            return internalValue;
        },
        setValue(value: string| null) {
            return setInternalValue(value);
        },
    }));

    const doSearch = useCallback((inputValue: string, target: (data: ISparePartData[]) => void, seq: number) => {
        const deliver = (items: ISparePartData[]) => {
            if (seq !== searchSeq.current) return;
            const data = [...items];
            data.unshift({ code: inputValue, name: '', price: null });
            target(data);
        };

        dataPage({
            resourceName:'saleables',
            searchText: inputValue,
            whenReady:(items) => deliver(items as ISparePartData[]),
            onFailure:() => {
                dataPage({
                    resourceName:'spareparts',
                    searchText: inputValue,
                    whenReady:(items) => deliver(items as ISparePartData[]),
                    onFailure:({url,status,text})=>{
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
        displayFormatter={(item)=>{ return  item?.code??''; }}
        optionFormatter={(item)=>{ return item?.code ? item.code + (item?.name?' ('+item.name+')':'') : (item?.name??'') }}
        onItemChange={(item)=>{
            setSelectedItem(item);
           if(item?.code) setInternalValue(item?.code);
           if(item?.name && nameRef?.current) nameRef?.current.setValue(item?.name);
           if(item?.price && priceRef?.current) priceRef?.current.setValue(item?.price)
        }}
        onSearch={(e,target)=>{
            const inputValue =e.currentTarget.value;
            if(!inputValue) return;

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
EditableCodeCell.displayName = "EditableCodeCell";
export {
    EditableCodeCell
}
