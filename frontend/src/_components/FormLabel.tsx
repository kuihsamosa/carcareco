export default function FormLabel({
    name,
    label,
    children,
    required,
}:{
    name:string,
    label:string,
    children?:React.ReactNode,
    required?:boolean,
}){
    return (
        <label htmlFor={name} className="block text-sm/6 font-medium text-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}{children}
    </label>
    )
}