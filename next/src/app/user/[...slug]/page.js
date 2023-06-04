
export default function Page({params}) {
    if (params['slug'].length != 3) {
        return <div className="error">
            <h2>Error: Incorrect URL format</h2>
            <p>Correct usage: /data/region/username/tag</p>
        </div>
    }
    return <div>{JSON.stringify(params, null, 2)}</div>
    return <div>{Object.entries(params)}</div>
    return <div>{Object.keys(params).map(el => <h1>{el}: {params[el]}</h1>)}</div>
}

