using UnityEngine;

public class ArcaneLightningImpact_ProSpawner : MonoBehaviour
{
    public GameObject effectPrefab;
    public KeyCode triggerKey = KeyCode.Space;
    public bool loopPreview = true;
    public float loopInterval = 1.25f;
    private float nextSpawn;

    void Update()
    {
        if (Input.GetKeyDown(triggerKey) || (loopPreview && Time.time >= nextSpawn))
        {
            if (effectPrefab != null) Instantiate(effectPrefab, transform.position, Quaternion.identity);
            nextSpawn = Time.time + loopInterval;
        }
    }
}
