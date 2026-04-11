// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * RibbonPuddle — ERC-721 token representing a unique synth preset ("puddle").
 *
 * Each token corresponds to a specific Ribbon Puddle configuration identified
 * by a keccak256 hash of its canonical settings JSON. First minter wins;
 * duplicate hashes are rejected. The creator address is stored permanently
 * so it survives transfers (enabling future royalty logic).
 *
 * Phase 1: mint + ownership only.
 * Phase 2 (future): mutate(tokenId, newHash, newName) for owner-editable states.
 */
contract RibbonPuddle is ERC721, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    struct PuddleState {
        bytes32 contentHash;  // keccak256 of canonical preset JSON
        string  name;         // optional display name (mutable by owner in Phase 2)
        string  metadataURI;  // optional IPFS metadata URI (ipfs://CID) with image
        address creator;      // original minter — never changes
        uint64  mintedAt;     // unix timestamp
    }

    // tokenId → state
    mapping(uint256 => PuddleState) private _states;

    // contentHash → tokenId (0 = not yet minted)
    mapping(bytes32 => uint256) private _hashToToken;

    event Minted(
        uint256 indexed tokenId,
        bytes32 indexed contentHash,
        address indexed creator,
        string  name,
        string  metadataURI
    );

    constructor() ERC721("Puddle", "PUDDLE") Ownable(msg.sender) {}

    // ─── Metadata ────────────────────────────────────────────────────────────

    /**
     * Returns token metadata URI.
     * If an IPFS metadataURI was stored at mint time (contains the QR image),
     * return it directly so marketplaces (OpenSea) can display the image.
     * Otherwise fall back to on-chain base64 JSON.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "RibbonPuddle: nonexistent token");
        PuddleState storage s = _states[tokenId];

        // Prefer IPFS metadata when available (has image)
        if (bytes(s.metadataURI).length > 0) {
            return s.metadataURI;
        }

        string memory displayName = bytes(s.name).length > 0
            ? string(abi.encodePacked("Puddle ", s.name))
            : string(abi.encodePacked("Puddle #", Strings.toString(tokenId)));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name":"', displayName, '",',
            '"description":"A unique Puddle synth preset. Load it at puddle.obfusco.us",',
            '"external_url":"https://puddle.obfusco.us"}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // ─── Minting ────────────────────────────────────────────────────────────

    /**
     * Mint a new Puddle for the caller.
     * @param contentHash  keccak256 of the canonical preset JSON (computed client-side)
     * @param name         optional display name (max 64 chars recommended)
     * @param metadataURI  optional IPFS metadata URI (e.g. "ipfs://CID") — enables image on OpenSea
     * @return tokenId     the new token ID
     */
    function mint(bytes32 contentHash, string calldata name, string calldata metadataURI)
        external
        returns (uint256 tokenId)
    {
        require(contentHash != bytes32(0), "RibbonPuddle: empty hash");
        require(_hashToToken[contentHash] == 0, "RibbonPuddle: already minted");

        tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);

        _states[tokenId] = PuddleState({
            contentHash:  contentHash,
            name:         name,
            metadataURI:  metadataURI,
            creator:      msg.sender,
            mintedAt:     uint64(block.timestamp)
        });
        _hashToToken[contentHash] = tokenId;

        emit Minted(tokenId, contentHash, msg.sender, name, metadataURI);
    }

    // ─── Read helpers ────────────────────────────────────────────────────────

    /** Returns true if this exact preset has already been minted. */
    function hashExists(bytes32 contentHash) external view returns (bool) {
        return _hashToToken[contentHash] != 0;
    }

    /** Returns the tokenId for a given content hash (0 if not minted). */
    function tokenIdForHash(bytes32 contentHash) external view returns (uint256) {
        return _hashToToken[contentHash];
    }

    /** Returns full state for a token. */
    function stateOf(uint256 tokenId)
        external
        view
        returns (
            bytes32 contentHash,
            string  memory name,
            string  memory metadataURI,
            address creator,
            uint64  mintedAt
        )
    {
        require(_ownerOf(tokenId) != address(0), "RibbonPuddle: nonexistent token");
        PuddleState storage s = _states[tokenId];
        return (s.contentHash, s.name, s.metadataURI, s.creator, s.mintedAt);
    }

    /** Returns the current owner of a given content hash (address(0) if not minted). */
    function ownerOfHash(bytes32 contentHash) external view returns (address) {
        uint256 tokenId = _hashToToken[contentHash];
        if (tokenId == 0) return address(0);
        return _ownerOf(tokenId);
    }

    // ─── ERC721Enumerable overrides ──────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
