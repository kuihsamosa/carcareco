import {
    getCookie 
  } from 'cookies-next/client';

const basePath = process.env.NEXT_PUBLIC_API_URL;

const getJwtToken =()=>{
  
    const jwt = getCookie('jwt');
    return jwt;
}

 

const dataPage =({
    resourceName,
    searchText,
    whenReady,
    onFailure
}:{
    resourceName:string,
    searchText:string,
    whenReady:IOnQuerySuccess,
    onFailure:IOnQueryFailure
})=> {
 
    const url = resourceName+'/page?'+new URLSearchParams({
      orderby: 'id',
      searchText: searchText,
      limit: '20',
      offset: '0'
    })
    query({
      url: url,
      method : 'GET',
      onSuccess: (result) => { 
        if (result.items) {
          whenReady(result.items); 
        } 
        else  {
          console.log(result); 
          return [];
        }
      },
      onFailure: onFailure
    });
  }

  export interface IOnQuerySuccess
  {
    (json:any):void // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  export interface IOnQueryFailure
  {
    ({
        url,
        status,
        text, 
    }:{
        url:string,
        status?:number |undefined,
        text:string, 
    }):void
  }

  const query = ({ 
     url, 
     method, 
     body, 
     onSuccess, 
     onFailure 
    }:{
        url:string,
        method:string,
        body?: any | null, // eslint-disable-line @typescript-eslint/no-explicit-any
        onSuccess:IOnQuerySuccess,
        onFailure:IOnQueryFailure

    }) => {
   
    const jwt = getJwtToken();
    const headers:HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (jwt) {
      headers['Authorization'] = 'Bearer ' + jwt;
    }
     
    if(!basePath) throw new Error("NEXT_PUBLIC_API_URL env not set");

    url = basePath +`/api/${url}`;
     
    body = !body ? undefined : JSON.stringify(body);
    fetch(url, {
      method: method,
      body: body,
      headers: headers
    }).then(response => {
   
     
      if (response.ok) {
        return response.json().then(json => {
            onSuccess(json);
          });
      } else {
        return response.text().then(text => {
          onFailure({
            url: url,
            status: response.status,
            text: text
          });
        });
      }
    }).catch((reason) => { 
      onFailure({
        url: url,
        text: reason.toString()
      });
    });
  };
   
  async function queryApi<T>(
    path: string,
    options?: { params?: Record<string, number | string> }
  ): Promise<T> {
    const jwt = getJwtToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    if (!basePath) throw new Error('NEXT_PUBLIC_API_URL env not set');
    const url = new URL(`${basePath}/api/${path}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }
    const res = await fetch(url.toString(), { method: 'GET', headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<T>;
  }

  async function patchApi<T>(path: string, body?: unknown): Promise<T> {
    const jwt = getJwtToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    if (!basePath) throw new Error('NEXT_PUBLIC_API_URL env not set');
    const res = await fetch(`${basePath}/api/${path}`, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<T>;
  }

  export {
      query, dataPage, queryApi, patchApi
  }