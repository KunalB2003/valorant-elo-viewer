import Link from 'next/link'
import styles from'./Nav.module.css'



export default function Nav() {
    return <div class={styles["navbar"]}>
        <span><Link href="/"><h1>Valorant Elo Viewer</h1></Link></span>
        <span class={styles["gap"]}></span>
        <span><Link href="user/">View a player</Link></span>
        <span><Link href="visualize/">Visualize</Link></span>
    </div>
    
}