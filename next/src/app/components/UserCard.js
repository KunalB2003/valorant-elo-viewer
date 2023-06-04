import styles from'./UserCard.module.css'

function parseRegion(region) {
    // eu, kr, br is fine
    if ( region == 'na') return 'us';
    else if (region == 'ap') return ''; // idk asia pacific
    else return region
}

export default function UserCard({user}) {
    // console.log(user)
    let region = parseRegion(user.region)
    return <div className={styles["card"]}>
        <img 
            className={styles["pfp__small"]}
            src={user.card.small}
            alt="profile picture"
        />
        <img
            className={styles["region-flag"]}
            src={`https://cdn.thetrackernetwork.com/cdn/flags/4x3/${region}.svg`}
            alt="flag"
        />
        <h2>
            
            {user.username}#{user.tag} ({user.region})</h2>
    </div>
}